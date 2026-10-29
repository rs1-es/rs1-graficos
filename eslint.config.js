const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['echarts.min.js', 'ecStat.min.js', 'ecSimpleTransform.js', 'node_modules/'] },
  js.configs.recommended,
  { rules: { 'no-unused-vars': ['error', { caughtErrors: 'none' }] } },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globals.node, echarts: 'readonly', ecStat: 'readonly', ecSimpleTransform: 'readonly' }
    }
  },
  { files: ['app.js'], languageOptions: { globals: { t: 'readonly' } } }
];
