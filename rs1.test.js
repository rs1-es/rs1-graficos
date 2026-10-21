// Pruebas de las capas puras: node rs1.test.js
const assert = require('assert');
const D = require('./rs1-data.js');
const { buildOption } = require('./rs1-chart.js');

const t = (k) => k;
const colors = { fg: '#333', soft: '#6e7079', split: '#eee', labelBg: 'white', bg: '#fff' };
const base = { fileType: 'csv', sep: ',', hasHeader: true, names: '', xIndex: null, yIndex: null, zIndex: null,
  xType: 'category', reverse: false, chartType: 'line', barStack: 'normal', yMin: null, yMax: null, orderIndex: null,
  orderDir: 'desc', movAvg: null, regType: 'linear', groupMethod: 'sum' };
const run = (text, over = {}, tOver = {}) => {
  const cfg = { ...base, ...over };
  const table = D.buildTable(text, cfg);
  return { table, ...buildOption(table, cfg, { t, lang: 'es', title: 'x', colors }) };
};
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok -', name); };

ok('coma decimal sólo en números, no en textos', () => {
  const tb = D.buildTable('a;b\n"Madrid, España";3,14\n"x";1.234,5', { ...base, sep: ';' });
  assert.deepStrictEqual(tb.rows, [['Madrid, España', 3.14], ['x', 1234.5]]);
});
ok('celdas vacías y filas cortas -> null (no "undefined")', () => {
  const tb = D.buildTable('a,b,c\n1,,3\n4,5', base);
  assert.deepStrictEqual(tb.rows, [[1, null, 3], [4, 5, null]]);
});
ok('cabecera sin duplicados/vacíos y nombres parciales', () => {
  const tb = D.buildTable('x,x,\n1,2,3', { ...base, names: 'fecha' });
  assert.deepStrictEqual(tb.header, ['fecha', 'x', 'c']);
});
ok('sin cabecera: primera fila es dato y se convierte a tiempo', () => {
  const tb = D.buildTable('2024-01-01,5\n2024-01-02,6', { ...base, hasHeader: false, xType: 'time' });
  assert.strictEqual(tb.rows.length, 2);
  assert.ok(Number.isFinite(tb.rows[0][0]));
});
ok('archivo vacío no lanza', () => {
  assert.strictEqual(D.buildTable('', { ...base, hasHeader: false }).rows.length, 0);
});
ok('JSON: anidado, ausentes, tipos conservados, envoltorio', () => {
  const tb = D.buildTable('{"datos":[{"a":1,"o":{"p":2}},{"a":"00123"}]}', { ...base, fileType: 'json' });
  assert.deepStrictEqual(tb.header, ['a', 'o.p']);
  assert.deepStrictEqual(tb.rows, [[1, 2], ['00123', null]]);
});
ok('JSON inválido da clave i18n', () => {
  try { D.buildTable('[1,2]', { ...base, fileType: 'json' }); assert.fail(); }
  catch (e) { assert.strictEqual(e.i18nKey, 'jsonError'); }
});
ok('índice X inexistente -> badColumn', () => {
  try { D.buildTable('a,b\n1,2', { ...base, xIndex: 5 }); assert.fail(); }
  catch (e) { assert.strictEqual(e.i18nKey, 'badColumn'); }
});
ok('separador y codificación', () => {
  assert.strictEqual(D.guessSeparator('d.csv', 'a;b;c\n1,5;2,5;3'), ';');
  assert.strictEqual(D.guessSeparator('d.tsv', 'a b'), '\t');
  const win = new Uint8Array([0x61, 0x2c, 0xf1]); // "a,ñ" en Windows-1252
  assert.strictEqual(D.decodeText(win.buffer), 'a,ñ');
});

const csv = 'f,a,b,c\n1,10,100,5\n2,20,200,6\n3,30,300,8\n4,25,250,7';
ok('diferencias: TODAS las series usan encode x:0,y:1 sobre datasets de 2 columnas', () => {
  const { option } = run(csv, { diff: true });
  assert.strictEqual(option.series.length, 3);
  option.series.forEach((s) => {
    assert.deepStrictEqual(s.encode, { x: 0, y: 1 });
    assert.strictEqual(option.dataset[s.datasetIndex].source[0].length, 2);
  });
});
ok('estadísticas con diferencias para la 3.ª serie (antes NaN)', () => {
  const { stats } = run(csv, { diff: true, showMax: true, showDev: true });
  assert.strictEqual(stats.length, 6);
  stats.forEach((s) => assert.ok(Number.isFinite(s.value), s.label));
  assert.strictEqual(stats.find((s) => s.label === 'c - statMax').value, 2);
});
ok('regresión/histograma: un dataset de transformación por serie, sin encadenar', () => {
  const { option } = run(csv, { regression: true, xType: 'value' });
  const regs = option.dataset.filter((d) => d.transform && d.transform[0].type === 'ecStat:regression');
  assert.strictEqual(regs.length, 3);
  regs.forEach((d) => assert.ok(option.dataset[d.fromDatasetIndex].source));   // origen = dataset con datos
  const h = run(csv, { histogram: true });
  const hs = h.option.dataset.filter((d) => d.transform && d.transform[0].type === 'ecStat:histogram');
  assert.strictEqual(hs.length, 3);
  hs.forEach((d) => assert.ok(h.option.dataset[d.fromDatasetIndex].source));
});
ok('agrupar va antes que ordenar; sort apunta a dim 1 (y) o 0 (x)', () => {
  const { option } = run(csv, { group: true, orderIndex: 2, yIndex: 2 });
  const tr = option.dataset.find((d) => d.transform).transform;
  assert.deepStrictEqual(tr.map((x) => x.type), ['ecSimpleTransform:aggregate', 'sort']);
  assert.strictEqual(tr[1].config.dimension, 1);
});
ok('ejes Y: 2 series -> 2 ejes; 3 series -> 1 eje compartido visible', () => {
  assert.strictEqual(run('f,a,b\n1,1,2', {}).option.yAxis.length, 2);
  const r = run(csv, {});
  assert.strictEqual(r.option.yAxis.length, 1);
  assert.ok(r.option.series.every((s) => s.yAxisIndex === 0));
  assert.ok(r.option.yAxis[0].show !== false);
});
ok('barras apiladas y 100 %: eje compartido y valores normalizados', () => {
  const r = run(csv, { chartType: 'bar', barStack: 'percent' });
  assert.strictEqual(r.option.yAxis.length, 1);
  const sum = r.option.series.reduce((a, s) => a + r.option.dataset[s.datasetIndex].source[1][1], 0);
  assert.ok(Math.abs(sum - 100) < 1e-9);
});
ok('tarta: varias columnas separadas; histograma/modelo ignorados sin error', () => {
  const r = run(csv, { chartType: 'pie', histogram: true, regression: true });
  assert.strictEqual(r.option.series.length, 3);
  assert.strictEqual(new Set(r.option.series.map((s) => s.center[0])).size, 3);
  assert.strictEqual(r.option.xAxis, undefined);
});
ok('media móvil: serie con y=1 para todas las columnas', () => {
  const r = run(csv, { movAvg: 2 });
  const ma = r.option.series.filter((s) => /movAvgSeries/.test(s.name));
  assert.strictEqual(ma.length, 3);
  ma.forEach((s) => assert.deepStrictEqual(s.encode, { x: 0, y: 1 }));
});
ok('yMin/yMax decimales y aviso de modelo con X categórico', () => {
  const r = run(csv, { yMin: 0.5, yMax: 0.9, regression: true });
  assert.strictEqual(r.option.yAxis[0].min, 0.5);
  assert.deepStrictEqual(r.notes, ['warnRegX']);
  assert.strictEqual(r.option.series.length, 3);
});
ok('Z de puntos usa la columna original indicada', () => {
  const r = run(csv, { chartType: 'scatter', yIndex: 1, zIndex: 3, xType: 'value' });
  assert.strictEqual(r.option.dataset[0].source[0].length, 3);
  assert.strictEqual(r.option.series[0].symbolSize([1, 2, 8]), 30);
});
console.log(`\n${n} pruebas OK`);
