#!/bin/bash
set -e
V0_DIR="/Users/demiantavolaro/Downloads/calibre-dashboard-design"
WEB_DIR="/Users/demiantavolaro/Documents/Proyectos/calibreAI/apps/web"
echo "1/5 - Eliminando frontend anterior..."
rm -rf "$WEB_DIR/src" "$WEB_DIR/public" "$WEB_DIR/styles"
echo "2/5 - Copiando componentes, lib, styles y assets..."
cp -r "$V0_DIR/components" "$WEB_DIR/"
cp -r "$V0_DIR/lib" "$WEB_DIR/src/lib"
cp -r "$V0_DIR/styles" "$WEB_DIR/"
cp -r "$V0_DIR/public/"* "$WEB_DIR/public/" 2>/dev/null || true
# Estructura de páginas (vacías, las creamos después)
mkdir -p "$WEB_DIR/src/pages" "$WEB_DIR/src/hooks"
# Copiar hooks si existen
[ -d "$V0_DIR/hooks" ] && cp -r "$V0_DIR/hooks/"* "$WEB_DIR/src/hooks/"
echo "3/5 - Adaptando imports en componentes custom..."
for file in sidebar metric-card pulse-button log-entry-card pitch-card theme-provider; do
  f="$WEB_DIR/components/${file}.tsx"
  [ -f "$f" ] && sed -i '' \
    -e "s|@/components/|../components/|g" \
    -e "s|@/lib/|../lib/|g" \
    -e "s|@/hooks/|../hooks/|g" \
    -e "s|next/link|react-router-dom|g" \
    "$f"
done
echo "4/5 - Adaptando imports en shadcn/ui..."
find "$WEB_DIR/components/ui" -name "*.tsx" -o -name "*.ts" | while read f; do
  sed -i '' \
    -e "s|@/lib/utils|../../lib/utils|g" \
    -e "s|@/components/ui|../ui|g" \
    -e "s|@/hooks/|../../hooks/|g" \
    "$f"
done
echo "5/5 - Copiando globals.css a styles/"
cp "$V0_DIR/app/globals.css" "$WEB_DIR/styles/globals.css"
echo ""
echo "✅ Migración base completa."
echo ""
echo "📋 QUEDA PENDIENTE (6 archivos manuales):"
echo "   ─────────────────────────────────────"
echo "   1. src/components/Layout.tsx     ← de app/layout.tsx"
echo "   2. src/pages/Dashboard.tsx       ← de app/page.tsx"
echo "   3. src/pages/Logs.tsx            ← de app/logs/page.tsx"
echo "   4. src/pages/Pitches.tsx         ← de app/pitches/page.tsx"
echo "   5. src/pages/Sponsorship.tsx     ← de app/sponsorship/page.tsx"
echo "   6. src/components/Sidebar.tsx    ← next/image → <img>"
echo ""
echo "📋 QUEDA PENDIENTE (infraestructura):"
echo "   ────────────────────────────────"
echo "   1. Instalar dependencias faltantes en package.json"
echo "   2. Configurar Vite + Tailwind v4 + PostCSS"
echo "   3. Actualizar index.html con Google Fonts"
echo "   4. Actualizar App.tsx con React Router"