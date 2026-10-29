// Capa de datos: sin DOM ni ECharts. Convierte texto CSV/TSV/JSON en una tabla
// { header: string[], rows: any[][], xi: number } y ofrece transformaciones puras.
(function (root) {
  'use strict';

  // Error con clave i18n: la UI decide cómo traducirlo
  const fail = (key) => Object.assign(new Error(key), { i18nKey: key });

  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

  // ---------- Detección de formato ----------

  const detectFileType = (name, text) => {
    name = (name || '').toLowerCase();
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.csv') || name.endsWith('.tsv')) return 'csv';
    const first = (typeof text === 'string') ? text.trimStart()[0] : '';
    return (first === '[' || first === '{') ? 'json' : 'csv';
  };

  // Separador más consistente en las primeras líneas (la coma va la última
  // para que los decimales con coma no se confundan con el separador)
  const guessSeparator = (name, text) => {
    if (/\.tsv$/i.test(name || '')) return '\t';
    const lines = String(text).split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, 5);
    if (lines.length === 0) return ',';
    let best = ',';
    let bestScore = 0;
    for (const c of ['\t', ';', '|', ',']) {
      const score = Math.min(...lines.map((l) => l.split(c).length - 1));
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    return best;
  };

  // UTF-8 estricto y, si falla (típico de Excel en español), Windows-1252
  const decodeText = (buffer) => {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch (e) {
      return new TextDecoder('windows-1252').decode(buffer);
    }
  };

  // ---------- Parseo CSV/TSV ----------

  // Respeta campos entre comillas ("" como escape, separadores y saltos de línea
  // dentro de ellas) y normaliza CRLF
  const parseDelimited = (text, sepChar) => {
    text = text.replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"' && field === '') {
        inQuotes = true;
      } else if (ch === sepChar) {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
    if (field !== '' || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
  };

  const DECIMAL_COMMA = /^-?(\d{1,3}(\.\d{3})+|\d+),\d+$/;

  // Celda -> número, texto o null (vacío/ausente). La coma decimal sólo se
  // interpreta cuando la celda tiene forma de número (no altera textos)
  const parseCell = (raw, decimalComma) => {
    if (raw === undefined || raw === null) return null;
    const s = String(raw).trim();
    if (s === '') return null;
    let candidate = s;
    if (decimalComma && DECIMAL_COMMA.test(s)) {
      candidate = s.replace(/\./g, '').replace(',', '.');
    }
    const n = Number(candidate);
    return Number.isFinite(n) ? n : s;
  };

  const toTime = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const ms = new Date(String(v).trim()).getTime();
    return Number.isNaN(ms) ? null : ms;
  };

  const csvToRaw = (text, o) => {
    const sepChar = (o.sep === '\\t') ? '\t' : (o.sep || ',');
    const decimalComma = sepChar !== ',';
    const raw = parseDelimited(text, sepChar);
    if (raw.length === 0) return { headerRaw: [], rows: [], width: 0 };
    const headerRaw = o.hasHeader ? raw.shift().map((h) => String(h).trim()) : [];
    let width = headerRaw.length;
    for (const r of raw) {
      if (r.length > width) width = r.length;
    }
    const rows = raw.map((r) => Array.from({ length: width }, (_, c) => parseCell(r[c], decimalComma)));
    return { headerRaw, rows, width };
  };

  // ---------- Parseo JSON ----------

  const flatten = (obj, prefix = '', out = {}) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        flatten(v, key, out);
      } else {
        out[key] = v;
      }
    }
    return out;
  };

  const jsonValue = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'boolean') return Number(v);
    if (Array.isArray(v)) return JSON.stringify(v);
    return v;
  };

  const jsonToRaw = (text) => {
    let json = JSON.parse(text);
    // Admite { "datos": [ {...}, ... ] }
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      const inner = Object.values(json).find((v) => Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === 'object');
      if (inner) json = inner;
    }
    if (!Array.isArray(json) || json.length === 0 ||
        json[0] === null || typeof json[0] !== 'object' || Array.isArray(json[0])) {
      throw fail('jsonError');
    }
    const flat = json.map((item) => (item !== null && typeof item === 'object' && !Array.isArray(item)) ? flatten(item) : {});
    const keys = [...new Set(flat.flatMap((o) => Object.keys(o)))];
    const rows = flat.map((o) => keys.map((k) => jsonValue(o[k])));
    return { headerRaw: keys, rows, width: keys.length };
  };

  // ---------- Tabla ----------

  const defaultColName = (i) => (i < 26 ? 'abcdefghijklmnopqrstuvwxyz'[i] : 'col' + (i + 1));

  // Nombres finales: los indicados por el usuario > cabecera del archivo > por
  // defecto. Sin vacíos ni duplicados (las transformaciones de ECharts
  // identifican las dimensiones por nombre)
  const makeHeader = (base, namesText, width) => {
    const custom = (namesText || '').split(',').map((s) => s.trim());
    const used = new Map();
    return Array.from({ length: width }, (_, i) => {
      let name = custom[i] || base[i] || defaultColName(i);
      const n = (used.get(name) || 0) + 1;
      used.set(name, n);
      if (n > 1) name = `${name}_${n}`;
      return name;
    });
  };

  // o: { fileType, sep, hasHeader, names, xIndex, xType }
  const buildTable = (text, o) => {
    const src = (o.fileType === 'json') ? jsonToRaw(text) : csvToRaw(text, o);
    if (src.rows.length === 0 || src.width === 0) {
      return { header: [], rows: [], xi: 0 };
    }
    const xi = (o.xIndex === null || o.xIndex === undefined) ? 0 : o.xIndex;
    if (xi < 0 || xi >= src.width) throw fail('badColumn');
    if (o.xType === 'time') {
      for (const r of src.rows) r[xi] = toTime(r[xi]);
    }
    return { header: makeHeader(src.headerRaw, o.names, src.width), rows: src.rows, xi };
  };

  // ---------- Selección y transformaciones ----------

  const resolveYCols = (table, yIndex) => {
    const width = table.header.length;
    if (yIndex !== null && yIndex !== undefined) {
      if (yIndex < 0 || yIndex >= width) throw fail('badColumn');
      return [yIndex];
    }
    return table.header.map((_, i) => i).filter((i) => i !== table.xi);
  };

  // Tabla reducida [x, y, (z)] de una serie. Todas las transformaciones
  // posteriores trabajan sobre estas 2-3 columnas (x = 0, y = 1, z = 2)
  const seriesTable = (rows, header, xi, yi, zi) => {
    const cols = (zi === null || zi === undefined) ? [xi, yi] : [xi, yi, zi];
    const names = cols.map((c) => header[c]);
    if (cols.length === 3) names[2] = `${names[2]} (Z)`;
    return { header: names, rows: rows.map((r) => cols.map((c) => r[c])) };
  };

  // Diferencia con el dato anterior (sin redondeos; el formato lo decide la UI)
  const diffTable = (st) => {
    const out = [];
    for (let i = 1; i < st.rows.length; i++) {
      const cur = st.rows[i];
      const prev = st.rows[i - 1];
      out.push([cur[0], (isNum(cur[1]) && isNum(prev[1])) ? cur[1] - prev[1] : null, ...cur.slice(2)]);
    }
    return { header: st.header, rows: out };
  };

  const movingAverage = (st, period) => {
    const p = Math.max(1, parseInt(period, 10) || 1);
    const out = [];
    for (let i = p - 1; i < st.rows.length; i++) {
      let sum = 0;
      let ok = true;
      for (let j = 0; j < p; j++) {
        const v = st.rows[i - j][1];
        if (!isNum(v)) {
          ok = false;
          break;
        }
        sum += v;
      }
      out.push([st.rows[i][0], ok ? sum / p : null]);
    }
    return { header: [st.header[0], st.header[1]], rows: out };
  };

  // ---------- Estadísticas ----------

  const finiteValues = (values) => values.filter(isNum);

  // Mínimo, máximo, media, mediana y desviación típica muestral (n-1)
  const summarize = (values) => {
    const v = finiteValues(values).sort((a, b) => a - b);
    const n = v.length;
    if (n === 0) return null;
    const mean = v.reduce((a, b) => a + b, 0) / n;
    const mid = n >> 1;
    const median = (n % 2) ? v[mid] : (v[mid - 1] + v[mid]) / 2;
    const deviation = (n > 1) ? Math.sqrt(v.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1)) : 0;
    return { min: v[0], max: v[n - 1], mean, median, deviation };
  };

  // Cuartiles (interpolación lineal) y bigotes de Tukey (1,5 · IQR) para caja y bigotes
  const boxStats = (values) => {
    const v = finiteValues(values).sort((a, b) => a - b);
    const n = v.length;
    if (n === 0) return null;
    const q = (p) => {
      const pos = (n - 1) * p;
      const lo = Math.floor(pos);
      return v[lo] + (v[Math.min(lo + 1, n - 1)] - v[lo]) * (pos - lo);
    };
    const q1 = q(0.25);
    const median = q(0.5);
    const q3 = q(0.75);
    const iqr = q3 - q1;
    const inside = v.filter((x) => x >= q1 - 1.5 * iqr && x <= q3 + 1.5 * iqr);
    return {
      q1, median, q3,
      low: inside[0], high: inside[inside.length - 1],
      outliers: v.filter((x) => x < inside[0] || x > inside[inside.length - 1])
    };
  };

  const api = {
    fail, isNum, detectFileType, guessSeparator, decodeText, parseDelimited, parseCell,
    buildTable, resolveYCols, seriesTable, diffTable, movingAverage, summarize, boxStats, finiteValues
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.RS1Data = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
