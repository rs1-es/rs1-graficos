// Construye la opción de ECharts a partir de una tabla y la configuración.
// Sin DOM: recibe las traducciones y los colores en `ctx`.
// Principio clave: cada serie trabaja con su PROPIO dataset reducido [x, y, (z)]
// y su propia cadena de transformaciones, así que x = dim 0 e y = dim 1 siempre.
(function (root) {
  'use strict';

  const D = (typeof module !== 'undefined' && module.exports) ? require('./rs1-data.js') : root.RS1Data;

  // ctx: { t, lang, title, colors: {fg, soft, split, labelBg, bg} }
  const buildOption = (table, cfg, ctx) => {
    const { t, colors } = ctx;
    const nf = new Intl.NumberFormat(ctx.lang, { maximumFractionDigits: 2 });
    const compact = new Intl.NumberFormat(ctx.lang, { notation: 'compact', maximumFractionDigits: 2 });
    const fmt = (v) => (D.isNum(v) ? nf.format(v) : v);

    const { header, xi } = table;
    const rows = cfg.reverse ? table.rows.slice().reverse() : table.rows;
    const yCols = D.resolveYCols(table, cfg.yIndex);
    const type = cfg.chartType;
    const isPie = type === 'pie';
    const isLine = type === 'line';
    const isBar = type === 'bar';
    const isScatter = type === 'scatter';

    const stackMode = isBar ? cfg.barStack : 'normal';
    const percent = stackMode === 'percent' && !cfg.diff;
    // Dos ejes Y sólo con 1-2 series sin apilar; en otro caso, un eje compartido
    // (antes, a partir de la 3.ª serie había ejes ocultos con escalas distintas)
    const sepAxes = !isPie && yCols.length <= 2 && stackMode === 'normal' && !cfg.histogram;
    const useHist = cfg.histogram && !isPie;
    const useModel = cfg.regression && !isPie && !useHist;
    const notes = [];
    if (useModel && cfg.xType === 'category') {
      notes.push(t('warnRegX'));
    }
    const modelOk = useModel && cfg.xType !== 'category';

    // Tamaño de los puntos (Z): se pierde con diferencias o agrupación
    const zi = (isScatter && cfg.zIndex !== null && cfg.zIndex >= 0 && cfg.zIndex < header.length &&
      !cfg.diff && !cfg.group) ? cfg.zIndex : null;
    let zMax = 0;
    if (zi !== null) {
      for (const r of rows) {
        if (D.isNum(r[zi]) && Math.abs(r[zi]) > zMax) zMax = Math.abs(r[zi]);
      }
    }

    // Suma por fila (para barras 100 %)
    const sums = percent
      ? rows.map((r) => yCols.reduce((a, c) => (D.isNum(r[c]) ? a + Math.abs(r[c]) : a), 0))
      : null;

    const datasets = [];
    const addDataset = (def) => datasets.push(def) - 1;
    const series = [];
    const stats = [];

    yCols.forEach((k, j) => {
      const name = header[k];
      let st = D.seriesTable(rows, header, xi, k, zi);
      if (cfg.diff) st = D.diffTable(st);

      // Estadísticas sobre los valores de ESTA serie (ya con diferencias si procede)
      if (cfg.showAvg || cfg.showMin || cfg.showMax || cfg.showMedian || cfg.showDev) {
        const s = D.summarize(st.rows.map((r) => r[1]));
        if (s) {
          if (cfg.showAvg) stats.push({ label: `${name} - ${t('statAvg')}`, value: s.mean });
          if (cfg.showMin) stats.push({ label: `${name} - ${t('statMin')}`, value: s.min });
          if (cfg.showMax) stats.push({ label: `${name} - ${t('statMax')}`, value: s.max });
          if (cfg.showMedian) stats.push({ label: `${name} - ${t('statMedian')}`, value: s.median });
          if (cfg.showDev) stats.push({ label: `${name} - ${t('statDev')}`, value: s.deviation });
        }
      }

      if (percent) {
        st = {
          header: st.header,
          rows: st.rows.map((r, i) => [r[0], (D.isNum(r[1]) && sums[i] > 0) ? (r[1] / sums[i]) * 100 : r[1], ...r.slice(2)])
        };
      }

      const baseDs = addDataset({ source: [st.header, ...st.rows], sourceHeader: true });

      // Cadena de transformaciones de la serie: agrupar -> ordenar
      const steps = [];
      if (cfg.group) {
        steps.push({
          type: 'ecSimpleTransform:aggregate',
          config: {
            resultDimensions: [{ from: st.header[0] }, { from: st.header[1], method: cfg.groupMethod }],
            groupBy: st.header[0]
          }
        });
      }
      if (cfg.orderIndex !== null) {
        steps.push({ type: 'sort', config: { dimension: cfg.orderIndex === xi ? 0 : 1, order: cfg.orderDir } });
      }
      const preHistDs = steps.length ? addDataset({ fromDatasetIndex: baseDs, transform: steps }) : baseDs;

      // Histograma: dataset propio sobre el resultado anterior
      const mainDs = useHist
        ? addDataset({ fromDatasetIndex: preHistDs, transform: [{ type: 'ecStat:histogram', config: { dimensions: [1] } }] })
        : preHistDs;

      const label = cfg.diff ? `${name} - ${t('diffSeries')}` : name;
      const s = { type, name: label, datasetIndex: mainDs };

      if (isPie) {
        // Varias columnas: una tarta por columna, repartidas en horizontal
        const n = yCols.length;
        const outer = (n === 1) ? 60 : Math.max(15, 60 / n);
        Object.assign(s, {
          encode: { itemName: 0, value: 1 },
          radius: [`${outer / 2}%`, `${outer}%`],
          center: [`${((j + 0.5) / n) * 100}%`, '55%']
        });
      } else {
        Object.assign(s, {
          encode: { x: 0, y: 1 },
          yAxisIndex: sepAxes ? j : 0,
          symbol: 'circle',
          showSymbol: isScatter || st.rows.length <= 50,
          symbolSize: 4
        });
        if (isLine) {
          if (cfg.area) s.areaStyle = {};
          if (cfg.smooth) s.smooth = true;
          if (cfg.step) s.step = 'middle';
          if (st.rows.length > 2000) s.sampling = 'lttb';
        }
        if (stackMode !== 'normal') s.stack = 'total';
        if (zi !== null && zMax > 0) {
          s.symbolSize = (val) => {
            const v = Array.isArray(val) ? Number(val[2]) : NaN;
            return Number.isFinite(v) ? 5 + 25 * (Math.abs(v) / zMax) : 3;
          };
        }
        if (cfg.showMin || cfg.showMax) {
          s.markPoint = { data: [] };
          if (cfg.showMin) s.markPoint.data.push({ type: 'min', name: t('statMin') });
          if (cfg.showMax) s.markPoint.data.push({ type: 'max', name: t('statMax') });
        }
        if (cfg.showAvg) {
          s.markLine = {
            data: [{
              type: 'average',
              name: t('statAvg'),
              label: { position: 'middle', formatter: t('avgMarkLine'), backgroundColor: colors.labelBg, color: 'inherit' }
            }]
          };
        }
      }
      series.push(s);

      if (isPie) return;

      if (cfg.movAvg !== null && cfg.movAvg > 0) {
        const ma = D.movingAverage(st, cfg.movAvg);
        const maDs = addDataset({ source: [ma.header, ...ma.rows], sourceHeader: true });
        series.push({
          type: 'line', name: `${name} - ${t('movAvgSeries')}`, datasetIndex: maDs,
          encode: { x: 0, y: 1 }, yAxisIndex: sepAxes ? j : 0,
          symbol: 'none', smooth: true, lineStyle: { type: 'dashed' }
        });
      }

      if (modelOk) {
        const regDs = addDataset({
          fromDatasetIndex: preHistDs,
          transform: [{ type: 'ecStat:regression', config: { method: cfg.regType } }]
        });
        series.push({
          type: 'line', name: `${name} - ${t('modelSeries')}`, datasetIndex: regDs,
          encode: { x: 0, y: 1, label: 2, tooltip: 1 }, yAxisIndex: sepAxes ? j : 0,
          symbol: 'none', smooth: true,
          label: { show: true, fontSize: 15 }, labelLayout: { dx: -50 }
        });
      }
    });

    const totalRows = rows.length;
    const option = {
      animation: totalRows <= 5000,
      aria: { enabled: true },
      title: { text: ctx.title, textStyle: { color: colors.fg } },
      tooltip: { trigger: isPie ? 'item' : 'axis', valueFormatter: (v) => fmt(v) },
      toolbox: {
        feature: {
          dataZoom: { yAxisIndex: false, title: { zoom: t('tbZoom'), back: t('tbZoomReset') } },
          // El fondo evita PNG transparentes (ilegibles en modo oscuro)
          saveAsImage: { title: t('tbSave'), backgroundColor: colors.bg },
          dataView: { readOnly: true, title: t('tbData') }
        }
      },
      legend: { type: 'scroll', bottom: 0, padding: [0, 0, 7, 0], textStyle: { color: colors.fg } },
      dataset: datasets,
      series
    };

    if (!isPie) {
      const xType = cfg.xType;
      const clip = xType !== 'category' && !isBar;
      option.grid = { containLabel: false, width: '65%', left: 'center', top: 40, bottom: 80 };
      const xName = useHist ? (yCols.length === 1 ? header[yCols[0]] : '') : header[xi];
      option.xAxis = {
        type: xType,
        name: xName,
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: { backgroundColor: colors.labelBg, color: colors.fg },
        axisLabel: { color: colors.soft, rotate: 30, width: 100, overflow: 'truncate' },
        axisLine: { lineStyle: { color: colors.soft } },
        ...(clip ? { min: 'dataMin', max: 'dataMax' } : {})
      };
      const mkY = (name) => ({
        type: 'value',
        alignTicks: true,
        name,
        nameLocation: 'middle',
        nameGap: 45,
        nameRotate: 90,
        nameTextStyle: { color: colors.fg },
        axisLabel: { color: colors.soft, formatter: (v) => compact.format(v) },
        axisLine: { show: true, lineStyle: { color: colors.soft } },
        splitLine: { lineStyle: { color: colors.split } },
        ...(cfg.yMin !== null ? { min: cfg.yMin } : {}),
        ...(cfg.yMax !== null ? { max: cfg.yMax } : {})
      });
      if (sepAxes) {
        option.yAxis = yCols.map((k) => mkY(useHist ? t('freqAxis') : header[k]));
      } else {
        const single = yCols.length === 1 ? header[yCols[0]] : (percent ? '%' : '');
        option.yAxis = [mkY(useHist ? t('freqAxis') : single)];
      }
    }

    return { option, stats, notes };
  };

  const api = { buildOption };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.RS1Chart = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
