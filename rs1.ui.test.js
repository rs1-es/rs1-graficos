// Pruebas de la capa de UI (app.js) con jsdom y ECharts simulado: node rs1.ui.test.js
const assert = require('assert');
const fs = require('fs');
const { JSDOM } = require('jsdom');

const read = (f) => fs.readFileSync(`${__dirname}/${f}`, 'utf8');
const html = read('index.html').replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/g, '');
const SCRIPTS = ['theme-init.js', 'i18n.js', 'rs1-data.js', 'rs1-chart.js', 'app.js'];

// Abre la página en jsdom; `hash` simula un enlace compartido
const openPage = (hash = '') => {
  const dom = new JSDOM(html, { url: `https://graficos.rs1.es/${hash}`, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window;
  const calls = { options: [], init: 0, clipboard: [] };
  const fakeChart = {
    setOption: (o) => calls.options.push(o), clear() {}, resize() {}, dispose() {}
  };
  w.echarts = { init: () => { calls.init++; return fakeChart; }, registerTransform() {} };
  w.ecStat = { transform: { regression: {}, histogram: {} } };
  w.ecSimpleTransform = { aggregate: {} };
  w.ResizeObserver = class { observe() {} };
  w.IntersectionObserver = class { observe() {} };
  w.matchMedia = () => ({ matches: false });
  w.TextDecoder = TextDecoder;
  Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async (s) => { calls.clipboard.push(s); } } });
  for (const f of SCRIPTS) {
    const s = w.document.createElement('script');
    s.textContent = read(f);
    w.document.body.appendChild(s);
  }
  return { w, d: w.document, calls };
};

const loadCsv = async ({ w, d }, name, text) => {
  const input = d.getElementById('file');
  const file = { name, arrayBuffer: async () => new TextEncoder().encode(text).buffer };
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new w.Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 20));
};

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('arranque: sin archivo no hay gráfico y se crea ECharts', () => {
  const { calls } = openPage();
  assert.strictEqual(calls.init, 1);
  assert.strictEqual(calls.options.length, 0);
});

test('tipo tarta desactiva las opciones que no aplican', () => {
  const { w, d } = openPage();
  const pie = d.getElementById('chartType');
  pie.value = 'pie';
  pie.dispatchEvent(new w.Event('change', { bubbles: true }));
  assert.ok(d.querySelectorAll('.category.is-disabled').length > 0);
  assert.ok(d.getElementById('smooth').disabled);
});

test('cargar un CSV genera el gráfico y las estadísticas', async () => {
  const ctx = openPage();
  await loadCsv(ctx, 'datos.csv', 'mes,ventas\nenero,10\nfebrero,20\nmarzo,30\n');
  // jsdom no calcula el layout, así que también se dibuja la copia flotante
  assert.ok(ctx.calls.options.length >= 1);
  assert.ok(ctx.calls.options[0].series.length >= 1);
  assert.strictEqual(ctx.d.getElementById('fileName').textContent, 'datos.csv');
});

test('archivo vacío muestra un mensaje en lugar de un gráfico', async () => {
  const ctx = openPage();
  await loadCsv(ctx, 'vacio.csv', 'a,b\n');
  assert.strictEqual(ctx.calls.options.length, 0);
  assert.ok(ctx.d.getElementById('stats').textContent.trim().length > 0);
});

test('cambiar una opción guarda sólo lo modificado en el hash', () => {
  const { w, d } = openPage();
  const title = d.getElementById('chartTitle');
  title.value = 'Mi título';
  title.dispatchEvent(new w.Event('input', { bubbles: true }));
  const params = new URLSearchParams(w.location.hash.slice(1));
  assert.deepStrictEqual([...params.keys()], ['chartTitle']);
  assert.strictEqual(params.get('chartTitle'), 'Mi título');
});

test('un enlace compartido restaura las opciones (y descarta valores inválidos)', () => {
  const { d } = openPage('#chartTitle=Hola&chartType=inexistente&smooth=1');
  assert.strictEqual(d.getElementById('chartTitle').value, 'Hola');
  assert.notStrictEqual(d.getElementById('chartType').value, 'inexistente');
  assert.strictEqual(d.getElementById('smooth').checked, true);
});

test('el botón de compartir copia la URL con el hash', async () => {
  const { w, d, calls } = openPage();
  const title = d.getElementById('chartTitle');
  title.value = 'X';
  title.dispatchEvent(new w.Event('input', { bubbles: true }));
  d.getElementById('shareBtn').click();
  await new Promise((r) => setTimeout(r, 0));
  assert.strictEqual(calls.clipboard.length, 1);
  assert.ok(calls.clipboard[0].endsWith('#chartTitle=X'));
});

test('el tipo X se detecta al cargar (línea) y se respeta si se elige a mano', async () => {
  const ctx = openPage();
  const xt = ctx.d.getElementById('xType');
  await loadCsv(ctx, 'a.csv', 'f,v\n2024-01-01,1\n2024-02-01,2\n2024-03-01,3\n');
  assert.strictEqual(xt.value, 'time');
  await loadCsv(ctx, 'b.csv', 'x,v\n1,1\n2,2\n3,3\n');
  assert.strictEqual(xt.value, 'value');
  await loadCsv(ctx, 'c.csv', 'm,v\nenero,1\nfebrero,2\n');
  assert.strictEqual(xt.value, 'category');
  xt.value = 'log';
  xt.dispatchEvent(new ctx.w.Event('change', { bubbles: true }));
  await loadCsv(ctx, 'b.csv', 'x,v\n1,1\n2,2\n3,3\n');
  assert.strictEqual(xt.value, 'log');
});

test('en barras el tipo X se mantiene como categoría', async () => {
  const ctx = openPage('#chartType=bar');
  await loadCsv(ctx, 'b.csv', 'x,v\n1,1\n2,2\n3,3\n');
  assert.strictEqual(ctx.d.getElementById('xType').value, 'category');
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL - ${name}\n${e.stack}`);
    }
  }
  console.log(failed ? `${failed} fallos` : `${tests.length} pruebas de UI OK`);
  process.exit(failed ? 1 : 0);
})();
