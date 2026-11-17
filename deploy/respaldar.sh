#!/usr/bin/env bash
# =============================================================================
#  respaldar.sh — Respaldo diario en el servidor Linux de producción
# =============================================================================
#  Equivalente a respaldar.ps1 (Windows): vuelca la base de datos y copia los
#  archivos subidos (storage/). Conserva los últimos 14 días.
#  Lee las credenciales de server/.env sin mostrarlas en la lista de procesos.
#
#  Programar todos los días a las 02:30 (crontab -e):
#    30 2 * * * /opt/precision-helpdesk/deploy/respaldar.sh >> /var/log/helpdesk-respaldo.log 2>&1
# =============================================================================
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="${DESTINO:-$RAIZ/backups}"
DIAS="${DIAS:-14}"
FECHA="$(date +%Y%m%d_%H%M)"
CARPETA="$DESTINO/respaldo_$FECHA"

leer() { grep -E "^$1=" "$RAIZ/server/.env" | head -1 | cut -d= -f2- | tr -d '\r' | sed 's/^"//; s/"$//'; }
DB_HOST="$(leer DB_HOST)"; DB_PORT="$(leer DB_PORT)"; DB_USER="$(leer DB_USER)"
DB_PASSWORD="$(leer DB_PASSWORD)"; DB_NAME="$(leer DB_NAME)"

mkdir -p "$CARPETA"
CRED="$(mktemp)"; trap 'rm -f "$CRED"' EXIT
chmod 600 "$CRED"
printf "[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n" "$DB_USER" "$DB_PASSWORD" "${DB_HOST:-localhost}" "${DB_PORT:-3306}" > "$CRED"

echo "[$(date '+%d/%m/%Y %H:%M:%S')] Respaldo -> $CARPETA"
mysqldump --defaults-extra-file="$CRED" --single-transaction --no-tablespaces \
  --default-character-set=utf8mb4 --routines --triggers "$DB_NAME" | gzip > "$CARPETA/base_datos.sql.gz"
tar -czf "$CARPETA/storage.tar.gz" -C "$RAIZ" storage
chmod -R go-rwx "$CARPETA"

# Limpieza de respaldos viejos
find "$DESTINO" -maxdepth 1 -type d -name 'respaldo_*' -mtime +"$DIAS" -exec rm -rf {} +
echo "[$(date '+%d/%m/%Y %H:%M:%S')] Listo: $(du -sh "$CARPETA" | cut -f1)"
