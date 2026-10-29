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

# Las librerías de terceros no deben cambiar sin querer (ver README para actualizarlas)
if ! sha256sum --quiet -c vendor.sha256; then
  echo "ERROR: Las librerías vendorizadas no coinciden con vendor.sha256." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: El comando 'node' no está disponible (necesario para las pruebas)." >&2
  exit 1
fi

echo "Ejecutando pruebas..."
npm test >/dev/null || { echo "ERROR: Las pruebas fallan (¿falta ejecutar npm install?). Despliegue cancelado." >&2; exit 1; }

# Se despliega desde una copia temporal para no modificar el código fuente
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
cp "${FILES[@]}" "$STAGE/"

# Versión = hash del contenido de los archivos propios. Se añade como ?v=... a
# los scripts y estilos en index.html, así que cada cambio invalida la caché
# del navegador y los archivos pueden cachearse durante mucho tiempo.
VERSIONED=(app.js i18n.js rs1-chart.js rs1-data.js theme-init.js styles.css echarts.min.js ecSimpleTransform.js ecStat.min.js)
VERSION=$(cat "${VERSIONED[@]}" | sha1sum | cut -c1-10)
for f in "${VERSIONED[@]}"; do
  sed -i -E "s#((src|href)=\"$f)\"#\\1?v=$VERSION\"#" "$STAGE/index.html"
done
echo "Versión: $VERSION"

INCLUDES=()
for f in "${VERSIONED[@]}"; do
  INCLUDES+=(--include "$f")
done

echo "Subiendo archivos a $BUCKET ..."
# 1) Scripts y estilos (versionados): caché larga
aws s3 sync "$STAGE" "$BUCKET" --exclude '*' "${INCLUDES[@]}" \
  --cache-control 'public, max-age=31536000, immutable'
# 2) Resto (index.html, sitemap, favicon) al final: siempre revalidar
aws s3 sync "$STAGE" "$BUCKET" --exclude '*' \
  --include index.html --include sitemap.xml --include favicon.png --include favicon.svg \
  --cache-control 'no-cache'

echo "Despliegue completado."
