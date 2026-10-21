// Capa de UI: DOM, eventos e instancias de ECharts.
// La lógica de datos está en rs1-data.js y las opciones del gráfico en rs1-chart.js.
(function () {
  'use strict';

  const { buildTable, detectFileType, guessSeparator, decodeText } = window.RS1Data;
  const { buildOption } = window.RS1Chart;

  // ---------- Referencias al DOM ----------

  const IDS = [
    'file', 'fileName', 'fileType', 'sep', 'includeHeader', 'columnNames', 'reverseData',
    'chartTitle', 'chartType', 'area', 'smooth', 'step', 'barStack', 'xIndex', 'yIndex', 'zIndex',
    'xType', 'yMin', 'yMax', 'showAvg', 'showMin', 'showMax', 'showMedian', 'showDev',
    'calcDiffCheck', 'histogram', 'groupCheck', 'groupMethod', 'orderIndex', 'orderDir',
    'movAvg', 'movAvgPeriod', 'regression', 'regType',
    'chart', 'stats', 'chartStep', 'chartFloat', 'chartFloatInner'
  ];
  const ui = Object.fromEntries(IDS.map((id) => [id, document.getElementById(id)]));
  const chartCol = document.querySelector('.chartcol');

  // ---------- Estado ----------

  const state = {
    text: null,          // contenido del archivo cargado
    fileName: null,
    guessedSep: ',',
    version: 0,          // se incrementa con cada archivo nuevo (clave de caché)
    tableKey: null,
    table: null,
    lastOption: null
  };

  // ---------- Configuración (única lectura del DOM) ----------

  const intOrNull = (el) => {
    const n = parseInt(el.value, 10);
    return Number.isNaN(n) ? null : n;
  };
  const numOrNull = (el) => {
    if (el.value.trim() === '') return null;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : null;
  };

  const readConfig = () => ({
    fileType: ui.fileType.value,
    sep: ui.sep.value || state.guessedSep,
    hasHeader: ui.includeHeader.checked,
    names: ui.columnNames.value,
    reverse: ui.reverseData.checked,
    title: ui.chartTitle.value.trim(),
    chartType: ui.chartType.value,
    area: ui.area.checked,
    smooth: ui.smooth.checked,
    step: ui.step.checked,
    barStack: ui.barStack.value,
    xIndex: intOrNull(ui.xIndex),
    yIndex: intOrNull(ui.yIndex),
    zIndex: intOrNull(ui.zIndex),
    xType: ui.xType.value,
    yMin: numOrNull(ui.yMin),
    yMax: numOrNull(ui.yMax),
    showAvg: ui.showAvg.checked,
    showMin: ui.showMin.checked,
    showMax: ui.showMax.checked,
    showMedian: ui.showMedian.checked,
    showDev: ui.showDev.checked,
    diff: ui.calcDiffCheck.checked,
    histogram: ui.histogram.checked,
    group: ui.groupCheck.checked,
    groupMethod: ui.groupMethod.value,
    orderIndex: intOrNull(ui.orderIndex),
    orderDir: ui.orderDir.value,
    movAvg: ui.movAvg.checked ? (intOrNull(ui.movAvgPeriod) || 3) : null,
    regression: ui.regression.checked,
    regType: ui.regType.value
  });

  // Sólo estos campos afectan al parseo: el resto no obliga a reparsear el archivo
  const tableKeyOf = (cfg) => JSON.stringify([
    state.version, cfg.fileType, cfg.sep, cfg.hasHeader, cfg.names, cfg.xIndex, cfg.xType
  ]);

  const getTable = (cfg) => {
    const key = tableKeyOf(cfg);
    if (key !== state.tableKey) {
      state.table = buildTable(state.text, cfg);
      state.tableKey = key;
    }
    return state.table;
  };

  // ---------- Estado de las opciones ----------
  // Cada fila del formulario declara cuándo aplica mediante atributos data-*:
  //   data-only="line bar"   sólo con esos tipos de gráfico
  //   data-not="pie"         no aplica a esos tipos
  //   data-filetype="csv"    sólo con ese tipo de archivo
  //   data-off-if="histogram"  se desactiva si esa casilla está marcada
  const words = (v) => (v || '').split(' ');

  const syncOptionStates = () => {
    const type = ui.chartType.value;
    const fileType = ui.fileType.value;
    document.querySelectorAll('.category[data-only], .category[data-not], .category[data-filetype], .category[data-off-if]')
      .forEach((row) => {
        const d = row.dataset;
        const enabled = (!d.only || words(d.only).includes(type)) &&
          (!d.not || !words(d.not).includes(type)) &&
          (!d.filetype || d.filetype === fileType) &&
          (!d.offIf || !ui[d.offIf].checked);
        row.classList.toggle('is-disabled', !enabled);
        row.querySelectorAll('input, select').forEach((el) => { el.disabled = !enabled; });
      });
    // Punto indicador en las secciones plegadas que tienen opciones activas
    document.querySelectorAll('details.group').forEach((g) => {
      const active = Array.from(g.querySelectorAll('input')).some((el) =>
        (el.type === 'checkbox') ? el.checked : (el.value.trim() !== ''));
      g.classList.toggle('has-active', active);
    });
  };

  // ---------- Tema y formato ----------

  const themeColors = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    return dark
      ? { fg: '#cbd5e1', soft: '#94a3b8', split: '#334155', labelBg: '#1e293b', bg: '#1e293b' }
      : { fg: '#333', soft: '#6e7079', split: '#e2e8f0', labelBg: 'white', bg: '#ffffff' };
  };
  const currentLang = () => document.documentElement.lang || 'es';
  const errText = (e) => (e && e.i18nKey ? t(e.i18nKey) : (e && e.message) || String(e));

  // ---------- ECharts ----------

  const charts = { main: null, float: null };

  const initCharts = () => {
    charts.main = echarts.init(ui.chart);
  };

  const registerTransforms = () => {
    echarts.registerTransform(ecStat.transform.regression);
    echarts.registerTransform(ecStat.transform.histogram);
    echarts.registerTransform(ecSimpleTransform.aggregate);
  };

  const getFloatChart = () => {
    if (!charts.float) charts.float = echarts.init(ui.chartFloatInner);
    return charts.float;
  };

  const clearCharts = () => {
    state.lastOption = null;
    charts.main.clear();
    if (charts.float) charts.float.clear();
  };

  // Panel flotante: cuando la sección del gráfico no está a la vista se muestra
  // una copia superpuesta (mitad inferior de la pantalla)
  const updateFloat = () => {
    if (!chartCol.classList.contains('visible')) {
      ui.chartFloat.hidden = true;
      document.body.classList.remove('float-open');
      return;
    }
    const rect = ui.chartStep.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight;
    ui.chartFloat.hidden = inView;
    document.body.classList.toggle('float-open', !inView);
    if (!inView) {
      const fc = getFloatChart();
      if (state.lastOption !== null) fc.setOption(state.lastOption, { notMerge: true });
      fc.resize();
    }
  };

  // Un único observador de tamaño sustituye a los listeners de resize
  new ResizeObserver(() => {
    if (charts.main) charts.main.resize();
    if (charts.float) charts.float.resize();
  }).observe(ui.chart);
  new ResizeObserver(() => {
    if (charts.float) charts.float.resize();
  }).observe(ui.chartFloatInner);

  new IntersectionObserver(updateFloat).observe(ui.chartStep);

  const refreshTheme = () => {
    charts.main.dispose();
    if (charts.float) {
      charts.float.dispose();
      charts.float = null;
    }
    initCharts();
    state.lastOption = null;
    if (state.text !== null) renderNow();
  };

  // ---------- Mensajes ----------

  const addLine = (text, isError) => {
    const p = document.createElement('p');
    if (isError) {
      p.style.background = 'var(--err-bg)';
      p.style.border = '1px solid var(--err-border)';
      p.style.color = 'var(--err-text)';
    }
    p.textContent = text;
    ui.stats.appendChild(p);
  };
  const showError = (msg) => {
    ui.stats.replaceChildren();
    addLine(msg, true);
  };

  // ---------- Render ----------

  const renderNow = () => {
    const cfg = readConfig();
    if (state.text === null) {
      ui.fileName.textContent = t('selectFirst');
      ui.fileName.style.color = '#dc2626';
      return;
    }
    ui.stats.replaceChildren();

    let table;
    try {
      table = getTable(cfg);
    } catch (e) {
      console.error(e);
      clearCharts();
      showError(t('processError') + errText(e));
      return;
    }
    if (table.rows.length === 0) {
      clearCharts();
      showError(t('noData'));
      return;
    }

    try {
      const ctx = { t, lang: currentLang(), title: cfg.title || state.fileName, colors: themeColors() };
      const result = buildOption(table, cfg, ctx);
      const nf = new Intl.NumberFormat(currentLang(), { maximumFractionDigits: 2 });
      result.stats.forEach((s) => addLine(`${s.label}: ${nf.format(s.value)}`));
      result.notes.forEach((n) => addLine(n));
      state.lastOption = result.option;
      charts.main.setOption(result.option, { notMerge: true });
      updateFloat();
    } catch (e) {
      console.error(e);
      clearCharts();
      showError(t('genError') + errText(e));
    }
  };

  let renderTimer = null;
  const scheduleRender = () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderNow, 200);
  };

  // ---------- Carga de archivos ----------

  const loadFile = async (file) => {
    state.fileName = file.name;
    ui.fileName.textContent = file.name;
    ui.fileName.style.color = '';
    chartCol.classList.add('visible');
    try {
      state.text = decodeText(await file.arrayBuffer());
    } catch (e) {
      state.text = null;
      showError(t('readError'));
      return;
    }
    state.version++;
    ui.fileType.value = detectFileType(file.name, state.text);
    syncOptionStates();
    state.guessedSep = guessSeparator(file.name, state.text);
    ui.sep.placeholder = (state.guessedSep === '\t') ? '\\t' : state.guessedSep;
    renderNow();
  };

  const resetFile = () => {
    state.text = null;
    state.fileName = null;
    ui.fileName.textContent = t('noFile');
    ui.fileName.style.color = '';
  };

  ui.file.addEventListener('change', () => {
    const file = ui.file.files[0];
    if (file) {
      loadFile(file);
    } else {
      resetFile();
    }
  });

  // Cualquier cambio de opciones regenera el gráfico (delegación de eventos)
  const main = document.querySelector('main');
  ['input', 'change'].forEach((evt) => {
    main.addEventListener(evt, (e) => {
      if (e.target === ui.file) return;
      syncOptionStates();
      scheduleRender();
    });
  });

  // ---------- Arrastrar y soltar (sólo para archivos) ----------

  const hasFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
  let dragDepth = 0;

  window.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    document.body.classList.add('dragging');
  });
  window.addEventListener('dragover', (e) => {
    if (hasFiles(e)) e.preventDefault();
  });
  window.addEventListener('dragleave', (e) => {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) document.body.classList.remove('dragging');
  });
  window.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    document.body.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    try {
      ui.file.files = e.dataTransfer.files;   // mantiene el <input> sincronizado
    } catch (err) { /* navegadores antiguos */ }
    loadFile(file);
  });

  // ---------- Integración con i18n.js (eventos en lugar de variables globales) ----------

  document.addEventListener('app:langchange', () => {
    // setLang() reescribe #fileName con "Ningún archivo seleccionado": se restaura
    ui.fileName.textContent = state.fileName || t('noFile');
    if (state.text !== null) scheduleRender();
  });
  document.addEventListener('app:themechange', refreshTheme);

  // ---------- Arranque ----------

  registerTransforms();
  initCharts();
  syncOptionStates();
})();
