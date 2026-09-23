let fileInput = document.getElementById('file');
let fileType = document.getElementById('fileType');
let sep = document.getElementById('sep');
let includeHeader = document.getElementById('includeHeader');
let columnNames = document.getElementById('columnNames');
let reverseData = document.getElementById('reverseData');
let chartTitle = document.getElementById('chartTitle');
let chartType = document.getElementById('chartType');
let area = document.getElementById('area');
let xIndex = document.getElementById('xIndex');
let yIndex = document.getElementById('yIndex');
let smooth = document.getElementById('smooth');
let step = document.getElementById('step');
let barStack = document.getElementById('barStack');
let zIndex = document.getElementById('zIndex');
let xType = document.getElementById('xType');
let yMin = document.getElementById('yMin');
let yMax = document.getElementById('yMax');
let showAvg = document.getElementById('showAvg');
let showMin = document.getElementById('showMin');
let showMax = document.getElementById('showMax');
let showMedian = document.getElementById('showMedian');
let showDev = document.getElementById('showDev');
let orderIndex = document.getElementById('orderIndex');
let orderDir = document.getElementById('orderDir');
let movAvg = document.getElementById('movAvg');
let movAvgPeriod = document.getElementById('movAvgPeriod');
let calcDiffCheck = document.getElementById('calcDiffCheck');
let histogram = document.getElementById('histogram');
let groupCheck = document.getElementById('groupCheck');
let groupMethod = document.getElementById('groupMethod');
let regression = document.getElementById('regression');
let regType = document.getElementById('regType');
let chartDiv = document.getElementById('chart');
let statsDiv = document.getElementById('stats');
let fileNameSpan = document.getElementById('fileName');
let chartCol = document.querySelector('.chartcol');
let chartStep = document.getElementById('chartStep');
let chartFloat = document.getElementById('chartFloat');
let myFloatChart = null;
let lastChartOptions = null;

let fileText = null;
let renderTimeout = null;

// Colores del gráfico según el tema activo (claro/oscuro)
let isDark = () => document.documentElement.dataset.theme === 'dark';
let chartFg = () => isDark() ? '#cbd5e1' : '#333';
let chartFgSoft = () => isDark() ? '#94a3b8' : '#6e7079';
let chartSplit = () => isDark() ? '#334155' : '#e2e8f0';
let chartLabelBg = () => isDark() ? '#1e293b' : 'white';

// Detección automática del tipo de archivo: primero por la extensión y,
// si no es concluyente (p. ej. ".txt" o sin extensión), inspeccionando el
// contenido del archivo
let detectFileType = (name, text) => {
  name = (name || '').toLowerCase();
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.csv') || name.endsWith('.tsv')) return 'csv';
  if (typeof text === 'string') {
    let trimmed = text.trimStart();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  }
  return 'csv';
};

fileInput.addEventListener('change', () => {
  fileNameSpan.innerText = (fileInput.files.length > 0) ? fileInput.files[0].name : t('noFile');
  fileNameSpan.style.color = '';
  if (fileInput.files.length === 0) {
    fileText = null;
    return;
  }
  chartCol.classList.add('visible');
  let reader = new FileReader();
  reader.onerror = () => {
    showErrorMessage(t('readError'));
  };
  reader.onload = () => {
    fileText = reader.result;
    fileType.value = detectFileType(fileInput.files[0].name, fileText);
    generateChart();
  };
  reader.readAsText(fileInput.files[0]);
});

// Drag & drop: permite arrastrar un archivo a cualquier punto de la página
// para cargarlo, mostrando un resaltado mientras el archivo se arrastra
let dragCounter = 0;
let setDragOver = (active) => {
  document.body.classList.toggle('dragging', active);
};
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) {
    dragCounter++;
    setDragOver(true);
  }
});
window.addEventListener('dragover', (e) => {
  e.preventDefault();
});
window.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    setDragOver(false);
  }
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  setDragOver(false);
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    // La detección del tipo de archivo la realiza el manejador 'change'
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

let generateChart = () => {
  if (fileText === null) {
    if (fileInput.files.length === 0) {
      fileNameSpan.innerText = t('selectFirst');
      fileNameSpan.style.color = '#dc2626';
    }
    return;
  }
  myChart.clear();
  if (myFloatChart !== null) {
    myFloatChart.clear();
  }
  // El contenedor puede haber estado oculto (tamaño 0) al inicializar ECharts
  myChart.resize();
  try {
    let data = (fileType.value == 'csv') ? CSVtoArr(fileText) : JSONtoArr(fileText);
    if (data.length === 0) {
      showErrorMessage(t('noData'));
      return;
    }
    renderChart(data, chartTitle.value != '' ? chartTitle.value : fileInput.files[0].name);
  } catch (e) {
    console.error(e);
    showErrorMessage(t('processError') + e.message);
  }
};

// Regeneración con pequeño retardo para no relanzar en cada pulsación de tecla
let scheduleRender = () => {
  clearTimeout(renderTimeout);
  renderTimeout = setTimeout(generateChart, 200);
};

// Regenerar automáticamente al cambiar cualquier opción
document.querySelectorAll('main input:not([type="file"]), main select').forEach((el) => {
  el.addEventListener('change', scheduleRender);
  el.addEventListener('input', scheduleRender);
});

// Panel flotante: cuando la sección del gráfico no está a la vista, se muestra
// una copia superpuesta ocupando la mitad inferior de la pantalla
let getFloatChart = () => {
  if (myFloatChart === null) {
    myFloatChart = echarts.init(document.getElementById('chartFloatInner'));
  }
  return myFloatChart;
};
let updateFloat = () => {
  if (!chartCol.classList.contains('visible')) {
    chartFloat.hidden = true;
    document.body.classList.remove('float-open');
    return;
  }
  let rect = chartStep.getBoundingClientRect();
  let inView = rect.bottom > 0 && rect.top < window.innerHeight;
  chartFloat.hidden = inView;
  document.body.classList.toggle('float-open', !inView);
  if (!inView) {
    let floatChart = getFloatChart();
    if (lastChartOptions !== null) {
      floatChart.setOption(lastChartOptions);
    }
    floatChart.resize();
  }
};
let floatObserver = new IntersectionObserver(updateFloat);
floatObserver.observe(chartStep);
window.addEventListener('resize', () => {
  if (myFloatChart !== null && !chartFloat.hidden) {
    myFloatChart.resize();
  }
});

// Parser CSV/TSV robusto: respeta campos entre comillas (con "" como escape
// de comillas y separadores/saltos de línea dentro de ellas) y normaliza CRLF
let parseDelimited = (text, sepCharacter) => {
  text = text.replace(/\r\n?/g, '\n');
  let rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (inQuotes) {
      if (ch == '"') {
        if (text[i + 1] == '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch == '"' && field == '') {
      inQuotes = true;
    } else if (ch == sepCharacter) {
      row.push(field);
      field = '';
    } else if (ch == '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field != '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || (r.length == 1 && r[0].trim() != ''));
}

let parseField = (value, isX, i, sepCharacter) => {
  value = String(value).replace(/\"/g, '').trim();
  // Sólo se cambia la coma decimal por punto si la coma no es el separador
  if (sepCharacter != ',') {
    value = value.replace(/\,/g, '.');
  }
  if (isX && xType.value == 'time' && i != 0) {
    return new Date(value).getTime();
  }
  return isNaN(value) ? value : parseFloat(value);
}

let CSVtoArr = (text, forcedSep) => {
  let sepCharacter = forcedSep || ((sep.value != '') ? sep.value : ',');
  // Permitir escribir \t como separador de tabulación
  if (sepCharacter == '\\t') {
    sepCharacter = '\t';
  }
  let rows = parseDelimited(text, sepCharacter);
  let data = [];
  for (let i = 0; i < rows.length; i++) {
    let fields = rows[i];
    data[i] = [];
    if (xIndex.value != '' && yIndex.value != '') {
      data[i].push(parseField(fields[parseInt(xIndex.value)], true, i, sepCharacter));
      data[i].push(parseField(fields[parseInt(yIndex.value)], false, i, sepCharacter));
    } else {
      for (let j = 0; j < fields.length; j++) {
        data[i].push(parseField(fields[j], j == 0, i, sepCharacter));
      }
    }
  }
  if (!includeHeader.checked) {
    if (columnNames.value != '') {
      let namesArray = columnNames.value.split(',');
      data.unshift(namesArray);
    } else {
      let namesArray = [];
      let letters = 'abcdefghijklmnopqrstuvwxyz';
      for (let i = 0; i < data[0].length; i++) {
        namesArray.push(letters[i]);
      }
      data.unshift(namesArray);
    }
  } else {
    if (columnNames.value != '') {
      let namesArray = columnNames.value.split(',');
      data[0] = namesArray;
    }
  }
  return data;
}

let JSONtoArr = (text) => {
  const jsonData = JSON.parse(text);
  if (!Array.isArray(jsonData) || jsonData.length === 0 ||
      typeof jsonData[0] !== 'object' || jsonData[0] === null || Array.isArray(jsonData[0])) {
    throw new Error(t('jsonError'));
  }
  const keys = [...new Set(jsonData.flatMap((item) => (typeof item === 'object' && item !== null) ? Object.keys(item) : []))];
  const escapeCsv = (v) => {
    let s = (v === undefined || v === null) ? '' : String(v);
    if (s.includes('"') || s.includes(',') || s.includes('\n')) {
      s = '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const headerRow = keys.join(',');
  const dataRows = jsonData.map((item) => keys.map((key) => escapeCsv(item[key])).join(','));
  const csvText = [headerRow, ...dataRows].join('\n');
  return CSVtoArr(csvText, ',');
}

let reverse = (data) => {
  let valuesArr = data.slice(1);
  let reverseArr = valuesArr.reverse();
  reverseArr.unshift(data[0]);
  return reverseArr;
}

let calcDiff = (data, index) => {
  let valuesArr = data.slice(1);
  let data1 = valuesArr.map((row) => row[index]);
  let data2 = Array.from(data1);
  data2.unshift(data2[0]);
  data2 = data2.slice(0, data2.length - 1);
  let diff = data2.map((item, i) => (data1[i] - item).toFixed(2));
  let diff2 = [];
  for (let k = 0; k < valuesArr.length; k++) {
    diff2.push([valuesArr[k][0], parseFloat(diff[k])]);
  }
  diff2.shift();
  diff2.unshift([data[0][0], data[0][index]]);

  return diff2;
}

// Media móvil: ventana deslizante que promedia los últimos `period` valores
let calcMovAvg = (data, index, period) => {
  period = parseInt(period);
  if (isNaN(period) || period < 1) {
    period = 1;
  }
  let valuesArr = data.slice(1);
  let data1 = valuesArr.map((row) => row[index]);
  let movAvgArr = [];
  for (let i = period - 1; i < data1.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data1[i - j];
    }
    movAvgArr.push([valuesArr[i][0], parseFloat((sum / period).toFixed(2))]);
  }
  movAvgArr.unshift([data[0][0], data[0][index]]);
  return movAvgArr;
}


let addStatistics = (stat, name, col, data) => {
  let p = document.createElement('p');
  let valuesArr = data.slice(1);
  let selectedColArr = valuesArr.map((row) => row[col]);
  if (stat == 'median') {
    // Orden numérico (ecStat.quantile no ordena internamente)
    selectedColArr = selectedColArr.slice().sort((a, b) => a - b);
  }
  p.innerText = data[0][col] + ' - ' + name + ': ' +
  ecStat.statistics[stat](selectedColArr).toFixed(2);
  statsDiv.appendChild(p);
}

let showErrorMessage = (message) => {
  statsDiv.innerHTML = '';
  let p = document.createElement('p');
  p.style.background = 'var(--err-bg)';
  p.style.border = '1px solid var(--err-border)';
  p.style.color = 'var(--err-text)';
  p.innerText = message;
  statsDiv.appendChild(p);
}

let findDataset = (chartOptions, dtId) => {
  let res;
  chartOptions.dataset.forEach((dt) => {
    if (dt.id == dtId) {
      res = chartOptions.dataset.indexOf(dt);
    }
  })
  return res;
}

let renderChart = (data, title) => {

  if (reverseData.checked) {
      data = reverse(data);
    }

  let chartOptions = {
    title: {
      text: title,
      textStyle: {
        color: chartFg()
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        saveAsImage: {},
        dataView: {
          readOnly: true
        }
      }
    },
    grid: {
      containLabel: false,
      width: '65%',
      left: 'center',
      top: 40,
      bottom: 80
    },
    legend: {
      type: 'scroll',
      bottom: 0,
      padding: [0, 0, 7, 0],
      textStyle: {
        color: chartFg()
      }
    },
    dataset: [
      {
        source: data
      }
    ],
    xAxis: {
      type: xType.value,
      name: data[0][0],
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        backgroundColor: chartLabelBg(),
        color: chartFg()
      },
      axisLabel: {
        color: chartFgSoft(),
        rotate: 30,
        width: 100,
        overflow: 'truncate'
      },
      axisLine: {
        lineStyle: {
          color: chartFgSoft()
        }
      },
      min: 'dataMin',
      max: 'dataMax',
    },
    yAxis: [],
    series: []
  }
  if (!includeHeader.checked && columnNames.value == '') {
      chartOptions.dataset.sourceHeader = false;
  } else {
      chartOptions.dataset.sourceHeader = true;
  }

  if (groupCheck.checked || histogram.checked || regression.checked || orderIndex.value != '') {
    chartOptions.dataset.push({
        id: 'transformations',
        transform: []
      });
  }

  if (groupCheck.checked) {
    echarts.registerTransform(ecSimpleTransform.aggregate);
  }

  if (regression.checked) {
    echarts.registerTransform(ecStat.transform.regression);
  }
  if (histogram.checked) {
    echarts.registerTransform(ecStat.transform.histogram);
  }

  if (chartType.value == 'pie') {
    delete chartOptions.xAxis;
    delete chartOptions.yAxis;
    delete chartOptions.grid;
    chartOptions.tooltip.trigger = 'item';
  }

  statsDiv.innerHTML = '';

  for (let k = 1; k < data[0].length; k++) {
    if (calcDiffCheck.checked) {
      chartOptions.dataset.push({
        id: 'diff_' + k,
        source: calcDiff(data, k)
      });
    }
  }

  if (orderIndex.value != '') {
    chartOptions.dataset[findDataset(chartOptions, 'transformations')].fromDatasetIndex = (calcDiffCheck.checked) ? findDataset(chartOptions, 'diff_' + orderIndex.value) : 0;
    chartOptions.dataset[findDataset(chartOptions, 'transformations')].transform.push({
      id: 'sort',
      type: 'sort',
      config: {
        dimension: parseInt(orderIndex.value),
        order: orderDir.value
      }
    });
  }

  if (groupCheck.checked) {
    chartOptions.dataset[findDataset(chartOptions, 'transformations')].fromDatasetIndex = (calcDiffCheck.checked) ? findDataset(chartOptions, 'diff_1') : 0;
    chartOptions.dataset[findDataset(chartOptions, 'transformations')].transform.push({
      id: 'aggregate',
      type: 'ecSimpleTransform:aggregate',
      config: {
        resultDimensions: [
        {
          from: data[0][0]
        }],
        groupBy: data[0][0]
      }
    })
  }



  // Barras apiladas 100%: dataset con los valores Y normalizados para que
  // cada fila sume 100 (sólo se aplica sin transformaciones ni diferencias,
  // ya que en ese caso el orden/agrupación redirigen a otros datasets)
  let hasTransforms = groupCheck.checked || histogram.checked || regression.checked || orderIndex.value != '';
  if (chartType.value == 'bar' && barStack.value == 'percent' && !hasTransforms && !calcDiffCheck.checked) {
    let norm = [data[0].slice()];
    for (let i = 1; i < data.length; i++) {
      let sum = 0;
      for (let c = 1; c < data[i].length; c++) {
        let v = parseFloat(data[i][c]);
        if (!isNaN(v)) sum += Math.abs(v);
      }
      norm.push(data[i].map((cell, c) => {
        if (c === 0) return cell;
        let v = parseFloat(data[i][c]);
        return (isNaN(v) || sum === 0) ? cell : v / sum * 100;
      }));
    }
    chartOptions.dataset.push({
      id: 'stack100',
      source: norm
    });
  }

  // Burbujas: escala de tamaños entre la columna Z y su valor máximo
  let zMax = null, zc = null;
  if (chartType.value == 'scatter' && zIndex.value != '') {
    zc = parseInt(zIndex.value);
    zMax = 0;
    for (let i = 1; i < data.length; i++) {
      let v = parseFloat(data[i][zc]);
      if (!isNaN(v) && v > zMax) zMax = v;
    }
    if (zMax <= 0) zMax = null;
  }

  for (let k = 1; k < data[0].length; k++) {
    let addOrder = orderIndex.value != '';
    let addHisto = histogram.checked;
    let addGroup = groupCheck.checked;
    let seriesOptions = {
      type: chartType.value,
      encode: {
        x: 0,
        y: k
      },
      datasetIndex: (addOrder || addHisto || addGroup) ? findDataset(chartOptions, 'transformations') : 0,
      symbol: (chartType.value == 'scatter')? 'circle' : 'none',
      symbolSize: 3,
      yAxisIndex: k - 1,
      name: data[0][k]
    }

    if (calcDiffCheck.checked) {
      seriesOptions = {
        type: chartType.value,
        encode: {
          x: 0,
          y: k
        },
        datasetIndex: (addOrder|| addHisto || addGroup) ? findDataset(chartOptions, 'transformations') : findDataset(chartOptions, 'diff_' + k),
        symbol: (chartType.value == 'scatter')? 'circle' : 'none',
        symbolSize: 3,
        yAxisIndex: k - 1,
        name: `${data[0][k]} - ${t('diffSeries')}`
      }
      if (smooth.checked && chartType.value == 'line') {
        seriesOptions.smooth = 0.3;
      }
    }

    if (chartType.value == 'pie') {
      delete seriesOptions.encode;
      seriesOptions.radius = ['30%','60%'];
      delete seriesOptions.yAxisIndex;
    }
    if (area.checked) {
      seriesOptions.areaStyle = {};
    }
    if (smooth.checked && chartType.value == 'line') {
      seriesOptions.smooth = 0.3;
    }
    if (step.checked && chartType.value == 'line') {
      seriesOptions.step = 'start';
    }
    if (chartType.value == 'bar' && barStack.value != 'normal') {
      seriesOptions.stack = 'total';
      if (barStack.value == 'percent' && !hasTransforms && !calcDiffCheck.checked) {
        seriesOptions.datasetIndex = findDataset(chartOptions, 'stack100');
      }
    }
    if (chartType.value == 'scatter' && zMax !== null) {
      seriesOptions.symbolSize = (val, params) => {
        let v = parseFloat(params.data ? params.data[zc] : params.value[zc]);
        return (isNaN(v) || zMax === 0) ? 3 : 5 + 25 * Math.abs(v) / zMax;
      };
    }
    if (showMin.checked || showMax.checked) {
      seriesOptions.markPoint = {
        data: []
      };
    }

    if (showMin.checked) {
      seriesOptions.markPoint.data.push({
        type: 'min'
      });
      addStatistics('min', t('statMin'), k, (calcDiffCheck.checked) ? chartOptions.dataset[findDataset(chartOptions, 'diff_' + k)].source : data);
    }
    if (showMax.checked) {
      seriesOptions.markPoint.data.push({
        type: 'max'
      });
      addStatistics('max', t('statMax'), k, (calcDiffCheck.checked) ? chartOptions.dataset[findDataset(chartOptions, 'diff_' + k)].source : data);
    }
    if (showMedian.checked) {
      addStatistics('median', t('statMedian'), k, (calcDiffCheck.checked) ? chartOptions.dataset[findDataset(chartOptions, 'diff_' + k)].source : data);
    }
    if (showDev.checked) {
      addStatistics('deviation', t('statDev'), k, (calcDiffCheck.checked) ? chartOptions.dataset[k].source : data);
    }
    if (showAvg.checked) {
      seriesOptions.markLine = {
        data: []
      };
      seriesOptions.markLine.data.push({
          label: {
            position: 'middle',
            formatter: t('avgMarkLine'),
            backgroundColor: chartLabelBg(),
            color: 'inherit'
          },
          type: 'average'
        });
      addStatistics('mean', t('statAvg'), k, (calcDiffCheck.checked) ? chartOptions.dataset[findDataset(chartOptions, 'diff_' + k)].source : data);
    }

    chartOptions.series.push(seriesOptions);

    if (histogram.checked) {
      chartOptions.dataset[findDataset(chartOptions, 'transformations')].fromDatasetIndex = (calcDiffCheck.checked) ? findDataset(chartOptions, 'diff_' + k) : 0;
      chartOptions.dataset[findDataset(chartOptions, 'transformations')].transform.push({
        id: 'histogram',
        type: 'ecStat:histogram',
        config: {
          dimensions: [k]
        }
      });
  }

    if (movAvg.checked && movAvgPeriod.value != '') {
      chartOptions.dataset.push({
        id: 'movavg_' + k,
        source: calcMovAvg((calcDiffCheck.checked) ? chartOptions.dataset[findDataset(chartOptions, 'diff_' + k)].source : data, (calcDiffCheck.checked) ? 1 : k, parseInt(movAvgPeriod.value))
      });
      chartOptions.series.push({
        type: 'line',
        encode: {
          x: 0,
          y: k
        },
        datasetIndex: findDataset(chartOptions, 'movavg_' + k),
        symbol: 'none',
        symbolSize: 3,
        yAxisIndex: k - 1,
        name: `${data[0][k]} - ${t('movAvgSeries')}`,
        smooth: 0.2
      })
    }

    if (regression.checked) {
      chartOptions.dataset[findDataset(chartOptions, 'transformations')].fromDatasetIndex = (calcDiffCheck.checked) ? findDataset(chartOptions, 'diff_' + k) : 0;
      chartOptions.dataset[findDataset(chartOptions, 'transformations')].transform.push({
        id: 'regression',
        type: 'ecStat:regression',
        config: {
          method: regType.value
        },
      });
      chartOptions.series.push({
        name: `${data[0][k]} - ${t('modelSeries')}`,
        type: 'line',
        datasetIndex: findDataset(chartOptions, 'transformations'),
        label: {
          show: true,
          fontSize: 15
        },
        labelLayout: {
          dx: -50
        },
        encode: {
          label: 2,
          tooltip: 1
        }
      })
    }


    let yAxisOptions = {
      type: 'value',
      alignTicks: true,
      name: (histogram.checked) ? t('freqAxis') : data[0][k],
      nameLocation: 'middle',
      nameRotate: 90,
      nameGap: 45,
      axisLabel: {
        color: chartFgSoft(),
        formatter: (value) => {
          if (value >= 1000000 || value <= -1000000) {
            if (Number.isInteger(value / 1000000)) {
              return (value / 1000000) + 'm';
            } else {
              return (value / 1000000).toFixed(2) + 'm';
            }
          } else if (value > 1000 || value < -1000) {
            if (Number.isInteger(value / 1000)) {
              return (value / 1000) + 'k';
            } else {
              return (value / 1000).toFixed(2) + 'k';
            }
          } else {
            return value;
          }
        }
      },
      axisLine: {
        lineStyle: {
          color: chartFgSoft()
        }
      },
      splitLine: {
        lineStyle: {
          color: chartSplit()
        }
      }
    }
    if (k >= 3) {
      yAxisOptions.show = false;
    }
    if (yMin.value != '') {
      yAxisOptions.min = parseInt(yMin.value);
    }
    if (yMax.value != '') {
      yAxisOptions.max = parseInt(yMax.value);
    }
    if (histogram.checked) {
      chartOptions.xAxis.name = data[0][k];
    }

    if (chartType.value != 'pie') {
      chartOptions.yAxis.push(yAxisOptions);
    }

    if (addGroup) {
      chartOptions.dataset[findDataset(chartOptions, 'transformations')].transform.forEach((tr) => {
        if(tr.id == 'aggregate') {
          tr.config.resultDimensions.push({
            from: data[0][k],
            method: groupMethod.value
            });
        }
      });
    }

  }

  lastChartOptions = chartOptions;
  try {
    myChart.setOption(chartOptions);
    updateFloat();
  } catch (e) {
    console.error(e);
    showErrorMessage(t('genError') + e.message);
    myChart.dispose();
    myChart = echarts.init(chartDiv);
  }
}

let myChart = echarts.init(chartDiv);

// Cambio de tema: reinicializa los gráficos de ECharts y redibuja con los
// colores del tema activo (sólo si ya hay un archivo cargado)
let refreshTheme = () => {
  myChart.dispose();
  myChart = echarts.init(chartDiv);
  if (myFloatChart !== null) {
    myFloatChart.dispose();
    myFloatChart = echarts.init(document.getElementById('chartFloatInner'));
    lastChartOptions = null;
  }
  if (fileText !== null) {
    generateChart();
  }
};

window.addEventListener('resize', function() {
  myChart.resize();
});
