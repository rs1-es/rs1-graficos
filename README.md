# RS1 Gráficos

Herramienta web para crear gráficos (con [Apache ECharts](https://echarts.apache.org/en/index.html)) a partir de archivos CSV/TSV y JSON

## Prueba online

[https://graficos.rs1.es]

## Requisitos

En la carpeta raíz del proyecto:
- "echarts.min.js"
    - [https://github.com/apache/echarts/tree/5.4.3/dist]
    - Script principal para generar los gráficos.
- "ecSimpleTransform.js"
    - [https://github.com/100pah/echarts-simple-transform/tree/main/dist]
    - Necesario para la función de agrupar.
    - La versión comprimida (ecSimpleTransform.min.js) no funciona correctamente.
- "ecStat.min.js"
    - [https://github.com/angelaifox/ecStat/tree/master/dist]
    - Requerido para crear histogramas y generar modelos.
- "app.js"
    - Lógica de la aplicación: carga y proceso de datos, configuración del gráfico y estadísticas.
