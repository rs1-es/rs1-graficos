# RS1 Gráficos

Herramienta web para crear gráficos (con [Apache ECharts](https://echarts.apache.org/en/index.html)) a partir de archivos CSV/TSV y JSON

## Prueba online

<https://graficos.rs1.es>

## Requisitos

En la carpeta raíz del proyecto:
- "echarts.min.js" (v6.1.0)
    - [https://github.com/apache/echarts/tree/v6.1.0/dist]
    - Script principal para generar los gráficos.
- "ecSimpleTransform.js" (v1.0.0)
    - [https://github.com/100pah/echarts-simple-transform/tree/main/dist]
    - Necesario para la función de agrupar.
    - La versión comprimida (ecSimpleTransform.min.js) no funciona correctamente.
- "ecStat.min.js" (v1.2.0)
    - [https://github.com/ecomfe/echarts-stat/tree/master/dist]
    - Requerido para crear histogramas y generar modelos.

Al actualizar una librería, regenera sus sumas de verificación (las comprueba `deploy.sh`):

```
sha256sum echarts.min.js ecSimpleTransform.js ecStat.min.js > vendor.sha256
```

Archivos propios del proyecto:
- "index.html", "styles.css" y "theme-init.js"
    - Página, estilos y tema claro/oscuro.
- "app.js"
    - Capa de UI: DOM, eventos, estadísticas e instancias de ECharts.
- "rs1-data.js"
    - Capa de datos (sin DOM): detección de formato, lectura de CSV/TSV/JSON y transformaciones.
- "rs1-chart.js"
    - Construye la opción de ECharts a partir de la tabla y la configuración.
- "i18n.js"
    - Traducciones ES/EN.

## Compartir configuración

El botón 🔗 copia un enlace con los ajustes del gráfico en el hash de la URL (nunca los datos). Al abrirlo se restauran las opciones; el archivo hay que cargarlo de nuevo.

## Pruebas

Las capas de datos y de gráfico se prueban con Node, sin dependencias. La UI (`app.js`) se prueba con jsdom y un ECharts simulado (`rs1.ui.test.js`, requiere `npm install`):

```
node rs1.test.js      # sólo datos y gráfico
npm test              # todo, incluida la UI
```

Análisis estático con ESLint (`npm install` la primera vez):

```
npm run lint
```

## Despliegue

`./deploy.sh <bucket>` ejecuta las pruebas (si fallan, aborta) y sube al bucket de S3 indicado solo los archivos necesarios; requiere AWS CLI y Node.
Añade a scripts y estilos un `?v=<hash>` en una copia temporal y los sube con caché larga; `index.html` se sube con `no-cache`.

## Licencias de terceros

`echarts.min.js` es de Apache ECharts (licencia Apache 2.0, cabecera incluida en el propio archivo).
`ecStat.min.js` y `ecSimpleTransform.js` proceden de los repositorios enlazados arriba, cada uno con su licencia.
