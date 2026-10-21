#!/usr/bin/env bash
# Despliega la página al bucket S3 "graficos.rs1.es".
# Se suben solamente los archivos necesarios para que funcione la página.
set -euo pipefail

BUCKET='s3://graficos.rs1.es/'

# Archivos esenciales: si falta alguno, aborta el despliegue
FILES=(
  index.html
  app.js
  echarts.min.js
  ecSimpleTransform.js
  ecStat.min.js
  i18n.js
  rs1-chart.js
  rs1-data.js
  styles.css
  theme-init.js
  sitemap.xml
  favicon.png
  favicon.svg
  sitemap.xml
)

echo "Comprobando archivos necesarios..."
for f in "${FILES[@]}"; do
  if [[ ! -f $f ]]; then
    echo "ERROR: Falta el archivo necesario '$f'. Despliegue cancelado." >&2
    exit 1
  fi
done

# Un sitemap vacío o corrupto perjudica la indexación; se valida
if ! grep -q '<urlset' sitemap.xml; then
  echo "ERROR: sitemap.xml no contiene un <urlset> válido." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: El comando 'aws' (AWS CLI) no está disponible." >&2
  exit 1
fi

echo "Subiendo archivos a $BUCKET ..."
# La whitelist (exclude * + include) garantiza que no se sube nada que
# la página no utilice (README, sitemap.xml, .git, etc.)
aws s3 sync . "$BUCKET" \
  --exclude '*' \
  $(printf '  --include %q' "${FILES[@]}")

echo "Despliegue completado."
