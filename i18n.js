// Diccionario de traducciones: cada clave tiene su versión en español e inglés
const I18N = {
  es: {
    docTitle: 'RS1 Gráficos',
    metaDescription: 'Crea gráficos fácilmente desde archivos CSV/TSV y JSON',
    h1: 'RS1 Gráficos',
    subtitle: 'Crea gráficos fácilmente desde archivos CSV/TSV y JSON',
    chart: 'Gráfico',
    stats: 'Estadísticas',
    step1: 'Carga un archivo',
    dataFile: 'Archivo de datos:',
    chooseFile: 'Elegir archivo',
    noFile: 'Ningún archivo seleccionado',
    dropHere: 'Suelta el archivo aquí para cargarlo',
    hintAuto: '(El gráfico se genera automáticamente al cargar el archivo o cambiar opciones. El archivo se procesa en el navegador, en ningún momento sale de tu dispositivo)',
    fileTypeLabel: 'Tipo de archivo:',
    hintFileType: '(Selecciona entre <code>CSV/TSV</code> y <code>JSON</code>)',
    sepLabel: 'Separación de campos:',
    hintSep: '(Por ejemplo: <code>,</code>, <code>;</code>, <code>\\t</code>)',
    headerLabel: 'Incluye cabecera:',
    hintHeader: '(CSV/TSV: Selecciona si los datos incluyen nombres de columnas)',
    step2: 'Modifica datos de entrada',
    colNamesLabel: 'Añadir/Cambiar nombres de columnas:',
    hintColNames: '(Puedes añadir nombres de columnas si los datos no los tienen, o modificar los existentes. Utiliza la coma <code>,</code> como separación entre columnas)',
    reverseLabel: 'Invertir orden:',
    hintReverse: '(Invierte el orden de las filas de los datos de origen)',
    step3: 'Configura el gráfico',
    titleLabel: 'Título:',
    titlePlaceholder: 'Mi gráfico',
    hintTitle: '(Añade un título para el gráfico. Por defecto se utiliza el nombre del archivo)',
    chartTypeLabel: 'Tipo de gráfico:',
    optLine: 'Línea',
    optBar: 'Barras',
    optScatter: 'Puntos',
    optPie: 'Tarta',
    hintChartType: '(Selecciona entre gráfico de <code>líneas</code>, <code>barras</code>, <code>puntos</code> o tipo <code>tarta</code>)',
    areaLabel: 'Área:',
    hintArea: '(Solo para gráficos de líneas: convierte líneas en áreas)',
    smoothLabel: 'Suavizar línea:',
    hintSmooth: '(Solo para gráficos de líneas: suaviza las líneas)',
    symbolsLabel: 'Símbolos:',
    hintSymbols: '(Solo para gráficos de líneas: muestra un punto en cada valor)',
    stepLabel: 'Escalonar línea:',
    hintStep: '(Solo para gráficos de líneas: convierte las líneas en escalones, útil para mostrar cambios discretos)',
    stackLabel: 'Barras apiladas:',
    hintStack: '(Solo para gráficos de barras con varias columnas Y: apila las series o las normaliza para que sumen 100%)',
    optBarNormal: 'No',
    optBarStacked: 'Sí',
    optBarPercent: 'Sí, 100%',
    zLabel: 'Tamaño (Z):',
    hintZ: '(Solo para gráficos de puntos: utiliza la columna indicada para dimensionar los puntos; se escala automáticamente entre el mínimo y el máximo de la columna)',
    columnsLabel: 'Columnas:',
    hintColumns: '(Indica qué columna utilizar para el eje X y el eje Y. Por defecto se utiliza la primera, n.º 0, como X y el resto como Y)',
    xTypeLabel: 'Tipo X:',
    optCategory: 'Categoría',
    optValue: 'Numérico',
    optTime: 'Tiempo',
    hintXType: '(Indica el tipo de datos del eje X: <code>categoría</code>, <code>numérico</code>, <code>tiempo</code> o <code>log</code>)',
    minMaxYLabel: 'Mín/Máx Y:',
    hintMinMax: '(Especifica un mínimo y/o máximo para el eje Y. Por defecto se utilizan el mínimo y máximo de los datos de origen)',
    avgLabel: 'Media:',
    hintAvg: '(Calcula la media de los datos del eje Y y la muestra en el gráfico y en el apartado de estadísticas)',
    minLabel: 'Mínimo:',
    hintMin: '(Calcula el mínimo de los datos del eje Y y lo muestra en el gráfico y en el apartado de estadísticas)',
    maxLabel: 'Máximo:',
    hintMax: '(Calcula el máximo de los datos del eje Y y lo muestra en el gráfico y en el apartado de estadísticas)',
    medianLabel: 'Mediana:',
    hintMedian: '(Calcula la mediana de los datos del eje Y y la muestra en el apartado de estadísticas)',
    devLabel: 'Desviación típica:',
    hintDev: '(Calcula la desviación típica muestral de los datos del eje Y y la muestra en el apartado de estadísticas)',
    diffLabel: 'Calcular diferencias:',
    hintDiff: '(Calcula la diferencia entre un dato y el anterior y la muestra en el gráfico)',
    histLabel: 'Histograma:',
    hintHist: '(Muestra un histograma de los datos)',
    groupLabel: 'Agrupar:',
    optSum: 'Suma',
    optCount: 'Contar',
    optFirst: 'Primero',
    optAverage: 'Media',
    optQ2: 'Mediana',
    optMin: 'Mínimo',
    optMax: 'Máximo',
    hintGroup: '(Agrupa datos de la misma categoría, calcula la operación especificada y la muestra en el gráfico)',
    sortLabel: 'Ordenar:',
    optDesc: 'Descendente',
    optAsc: 'Ascendente',
    hintSort: '(Ordena los datos por la columna indicada; por defecto, la n.º 0. Desactívalo para recuperar el orden original)',
    movAvgLabel: 'Media móvil:',
    hintMovAvg: '(Calcula la media móvil, con el período especificado. Por ejemplo, <code>3</code> para utilizar los 3 últimos datos)',
    modelLabel: 'Generar modelo:',
    optLinear: 'Lineal',
    optExponential: 'Exponencial',
    optLogarithmic: 'Logarítmico',
    optPolynomial: 'Polinómico',
    hintModel: '(Genera un modelo <code>lineal</code>, <code>exponencial</code>, <code>logarítmico</code> o <code>polinómico</code> con los datos y lo muestra en el gráfico)',
    footerTitle: 'RS1 Gráficos',
    footerAI: 'Página creada con ayuda de la inteligencia artificial',
    footerEngine: 'Motor de gráficos:',
    footerContact: 'Contacto:',
    selectFirst: 'Selecciona primero un archivo de datos',
    readError: 'No se pudo leer el archivo seleccionado',
    noData: 'El archivo no contiene datos',
    processError: 'Error al procesar el archivo: ',
    jsonError: 'El JSON debe ser un array de objetos, por ejemplo: [{"col1": 1, "col2": 2}, ...]',
    genError: 'Error al generar el gráfico: ',
    diffSeries: 'diferencias',
    movAvgSeries: 'media móvil',
    modelSeries: 'modelo',
    avgMarkLine: 'Media: {c}',
    freqAxis: 'frecuencia',
    statMin: 'Mínimo',
    statMax: 'Máximo',
    statMedian: 'Mediana',
    statDev: 'Desviación típica',
    statAvg: 'Media',
    darkMode: 'Modo oscuro',
    lightMode: 'Modo claro',
    shareLink: 'Copiar enlace con la configuración (sin datos)',
    shareCopied: 'Enlace copiado',
    tbSave: 'Guardar como imagen',
    tbData: 'Ver datos',
    tbZoom: 'Zoom (selección)',
    tbZoomReset: 'Restablecer zoom',
    warnRegX: 'El modelo necesita un eje X de tipo numérico o tiempo',
    badColumn: 'El índice de columna indicado no existe en los datos',
    grpChart: 'Tipo y aspecto',
    grpAxes: 'Columnas y ejes',
    grpStats: 'Estadísticas',
    grpTransform: 'Transformaciones',
    ariaYCol: 'Columna Y',
    ariaYMax: 'Máximo del eje Y',
    ariaGroupOp: 'Operación de agrupación',
    ariaOrderDir: 'Dirección del orden',
    ariaOrderCol: 'Columna de ordenación',
    ariaPeriod: 'Período',
    ariaModelType: 'Tipo de modelo'
  },
  en: {
    docTitle: 'RS1 Charts',
    metaDescription: 'Create charts easily from CSV/TSV and JSON files',
    h1: 'RS1 Charts',
    subtitle: 'Create charts easily from CSV/TSV and JSON files',
    chart: 'Chart',
    stats: 'Statistics',
    step1: 'Upload a file',
    dataFile: 'Data file:',
    chooseFile: 'Choose file',
    noFile: 'No file selected',
    dropHere: 'Drop the file here to upload it',
    hintAuto: '(The chart is generated automatically when the file is loaded or options are changed. The file is processed in the browser, it never leaves your device)',
    fileTypeLabel: 'File type:',
    hintFileType: '(Choose between <code>CSV/TSV</code> and <code>JSON</code>)',
    sepLabel: 'Field separator:',
    hintSep: '(For example: <code>,</code>, <code>;</code>, <code>\\t</code>)',
    headerLabel: 'Includes header:',
    hintHeader: '(CSV/TSV: Check if the data includes column names)',
    step2: 'Modify input data',
    colNamesLabel: 'Add/Change column names:',
    hintColNames: '(You can add column names if the data does not have them, or change the existing ones. Use the comma <code>,</code> as separator between columns)',
    reverseLabel: 'Reverse order:',
    hintReverse: '(Reverses the row order of the source data)',
    step3: 'Configure the chart',
    titleLabel: 'Title:',
    titlePlaceholder: 'My chart',
    hintTitle: '(Add a title for the chart. The file name is used by default)',
    chartTypeLabel: 'Chart type:',
    optLine: 'Line',
    optBar: 'Bar',
    optScatter: 'Scatter',
    optPie: 'Pie',
    hintChartType: '(Choose between <code>line</code>, <code>bar</code>, <code>scatter</code> or <code>pie</code> chart)',
    areaLabel: 'Area:',
    hintArea: '(Line charts only: turns lines into areas)',
    smoothLabel: 'Smooth line:',
    hintSmooth: '(Line charts only: smooths the lines)',
    symbolsLabel: 'Symbols:',
    hintSymbols: '(Line charts only: shows a marker on every value)',
    stepLabel: 'Stepped line:',
    hintStep: '(Line charts only: turns lines into steps, useful to show discrete changes)',
    stackLabel: 'Stacked bars:',
    hintStack: '(Bar charts with several Y columns only: stacks the series or normalizes them to add up to 100%)',
    optBarNormal: 'No',
    optBarStacked: 'Yes',
    optBarPercent: 'Yes, 100%',
    zLabel: 'Size (Z):',
    hintZ: '(Scatter charts only: uses the given column to size the points; the scale is automatically adjusted between the minimum and maximum of the column)',
    columnsLabel: 'Columns:',
    hintColumns: '(Indicates which column to use for the X axis and the Y axis. By default the first one, No. 0, is used as X and the rest as Y)',
    xTypeLabel: 'X type:',
    optCategory: 'Category',
    optValue: 'Numeric',
    optTime: 'Time',
    hintXType: '(Indicates the type of data on the X axis: <code>category</code>, <code>numeric</code>, <code>time</code>, or <code>log</code>)',
    minMaxYLabel: 'Min/Max Y:',
    hintMinMax: '(Specifies a minimum and/or maximum for the Y axis. By default the minimum and maximum of the source data are used)',
    avgLabel: 'Average:',
    hintAvg: '(Calculates the average of the Y axis data and shows it in the chart and in the statistics section)',
    minLabel: 'Minimum:',
    hintMin: '(Calculates the minimum of the Y axis data and shows it in the chart and in the statistics section)',
    maxLabel: 'Maximum:',
    hintMax: '(Calculates the maximum of the Y axis data and shows it in the chart and in the statistics section)',
    medianLabel: 'Median:',
    hintMedian: '(Calculates the median of the Y axis data and shows it in the statistics section)',
    devLabel: 'Standard deviation:',
    hintDev: '(Calculates the sample standard deviation of the Y axis data and shows it in the statistics section)',
    diffLabel: 'Calculate differences:',
    hintDiff: '(Calculates the difference between each value and the previous one and shows it in the chart)',
    histLabel: 'Histogram:',
    hintHist: '(Shows a histogram of the data)',
    groupLabel: 'Group:',
    optSum: 'Sum',
    optCount: 'Count',
    optFirst: 'First',
    optAverage: 'Average',
    optQ2: 'Median',
    optMin: 'Minimum',
    optMax: 'Maximum',
    hintGroup: '(Groups data of the same category, calculates the specified operation and shows it in the chart)',
    sortLabel: 'Sort:',
    optDesc: 'Descending',
    optAsc: 'Ascending',
    hintSort: '(Sorts the data by the specified column; No. 0 by default. Turn it off to get the original order back)',
    movAvgLabel: 'Moving average:',
    hintMovAvg: '(Calculates the moving average with the specified period. For example, <code>3</code> to use the last 3 data points)',
    modelLabel: 'Generate model:',
    optLinear: 'Linear',
    optExponential: 'Exponential',
    optLogarithmic: 'Logarithmic',
    optPolynomial: 'Polynomial',
    hintModel: '(Generates a <code>linear</code>, <code>exponential</code>, <code>logarithmic</code> or <code>polynomial</code> model with the data and shows it in the chart)',
    footerTitle: 'RS1 Charts',
    footerAI: 'Page created with the help of artificial intelligence',
    footerEngine: 'Chart engine:',
    footerContact: 'Contact:',
    selectFirst: 'Select a data file first',
    readError: 'The selected file could not be read',
    noData: 'The file contains no data',
    processError: 'Error processing the file: ',
    jsonError: 'The JSON must be an array of objects, e.g.: [{"col1": 1, "col2": 2}, ...]',
    genError: 'Error generating the chart: ',
    diffSeries: 'differences',
    movAvgSeries: 'moving average',
    modelSeries: 'model',
    avgMarkLine: 'Average: {c}',
    freqAxis: 'frequency',
    statMin: 'Minimum',
    statMax: 'Maximum',
    statMedian: 'Median',
    statDev: 'Standard deviation',
    statAvg: 'Average',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    shareLink: 'Copy link with the settings (no data)',
    shareCopied: 'Link copied',
    tbSave: 'Save as image',
    tbData: 'View data',
    tbZoom: 'Zoom (selection)',
    tbZoomReset: 'Reset zoom',
    warnRegX: 'The model needs a numeric or time X axis',
    badColumn: 'The given column index does not exist in the data',
    grpChart: 'Type and appearance',
    grpAxes: 'Columns and axes',
    grpStats: 'Statistics',
    grpTransform: 'Transformations',
    ariaYCol: 'Y column',
    ariaYMax: 'Y axis maximum',
    ariaGroupOp: 'Grouping operation',
    ariaOrderDir: 'Sort direction',
    ariaOrderCol: 'Sort column',
    ariaPeriod: 'Period',
    ariaModelType: 'Model type'
  }
};

// Acceso seguro a localStorage (puede lanzar excepciones en modo privado o con
// el almacenamiento bloqueado)
const store = {
  get: (key) => {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) { /* sin persistencia */ }
  }
};

const defaultLang = () => ((navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es');
const savedLang = store.get('lang');
let i18nLang = I18N[savedLang] ? savedLang : defaultLang();

// Traducción con respaldo: idioma actual -> español -> la propia clave
const tr = (lang, key) => (I18N[lang] && I18N[lang][key]) ?? I18N.es[key] ?? key;

// Función de traducción para los textos generados dinámicamente (usada en app.js)
const t = (key) => tr(i18nLang, key);

const setLang = (lang) => {
  i18nLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = tr(lang, el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = tr(lang, el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', tr(lang, el.dataset.i18nAria));
  });
  document.title = tr(lang, 'docTitle');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', tr(lang, 'metaDescription'));
  document.getElementById('langToggle').textContent = (lang === 'es') ? 'EN' : 'ES';
  store.set('lang', lang);
};

document.getElementById('langToggle').addEventListener('click', () => {
  setLang((i18nLang === 'es') ? 'en' : 'es');
  // app.js escucha este evento (nombres de series, estadísticas, nombre de archivo...)
  document.dispatchEvent(new CustomEvent('app:langchange', { detail: { lang: i18nLang } }));
});

setLang(i18nLang);

// Tema claro/oscuro
const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  store.set('theme', theme);
  const themeToggle = document.getElementById('themeToggle');
  // El icono muestra el modo al que se cambiará; el texto descriptivo va en aria-label/title
  themeToggle.textContent = (theme === 'dark') ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', (theme === 'dark') ? t('lightMode') : t('darkMode'));
  themeToggle.title = (theme === 'dark') ? t('lightMode') : t('darkMode');
};

document.getElementById('themeToggle').addEventListener('click', () => {
  setTheme((document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark');
  // app.js reinicializa ECharts y redibuja con los colores del nuevo tema
  document.dispatchEvent(new CustomEvent('app:themechange'));
});

setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
