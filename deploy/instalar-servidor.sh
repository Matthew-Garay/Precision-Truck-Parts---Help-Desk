#!/usr/bin/env bash
# =============================================================================
#  instalar-servidor.sh — Prepara un servidor Ubuntu 22.04/24.04 desde cero
# =============================================================================
#  Pensado para la VM gratuita de Oracle Cloud (Always Free), pero sirve en
#  cualquier Ubuntu. Instala Node.js 22 LTS, MySQL 8, Caddy (HTTPS
#  automático) y PM2, abre los puertos 80/443 y deja el proyecto en
#  /opt/precision-helpdesk.
#
#  Uso (en el servidor, con un usuario que tenga sudo):
#    curl -fsSL https://raw.githubusercontent.com/<usuario>/<repo>/master/deploy/instalar-servidor.sh -o instalar.sh
#    bash instalar.sh https://github.com/<usuario>/<repo>.git
#
#  Lo que NO hace (pasos manuales, ver docs/despliegue.md):
#    - crear server/.env con tus claves
#    - importar la base de datos y los archivos de storage/
#    - poner tu dominio en deploy/Caddyfile
# =============================================================================
set -euo pipefail

REPO="${1:?Uso: bash instalar.sh <url-del-repositorio-git>}"
DIR="/opt/precision-helpdesk"
paso() { echo; echo "==> $*"; }

paso "Actualizando el sistema"
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https netfilter-persistent iptables-persistent

paso "Node.js 22 LTS"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

paso "MySQL 8"
sudo apt-get install -y mysql-server
sudo systemctl enable --now mysql
# Zona horaria de México para que NOW() coincida con el sistema
sudo mysql -e "SET PERSIST time_zone = '-06:00';" || true   # PERSIST: sobrevive a reinicios

paso "Caddy (HTTPS automático con Let's Encrypt)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y && sudo apt-get install -y caddy
fi

paso "PM2 (mantiene el backend encendido)"
sudo npm install -g pm2

paso "Firewall: abrir 80 y 443 (las imágenes de Oracle traen iptables cerrado)"
for p in 80 443; do
  sudo iptables -C INPUT -p tcp --dport $p -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport $p -j ACCEPT
done
sudo netfilter-persistent save

paso "Código en $DIR"
sudo mkdir -p "$DIR" && sudo chown "$USER":"$USER" "$DIR"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi
cd "$DIR"
npm ci
npm run build
chmod +x deploy/respaldar.sh
mkdir -p storage/Evidencias_Tickets/_tmp_upload storage/Insumos storage/Manuales backups

cat <<EOF

=============================================================================
 Instalación base terminada. Faltan estos pasos (docs/despliegue.md):

  1. Usuario de MySQL:  edita deploy/mysql-usuario.sql y ejecuta
                        sudo mysql < deploy/mysql-usuario.sql
  2. Base de datos:     importa tu respaldo (base_datos.sql)
  3. Archivos:          copia storage/ de tu respaldo a $DIR/storage
  4. Configuración:     cp server/.env.example server/.env  y edítalo
                        (NODE_ENV=production, HOST=127.0.0.1, APP_URL, ...)
  5. Dominio + HTTPS:   pon tu dominio en deploy/Caddyfile y ejecuta
                        sudo cp deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy
  6. Arrancar:          pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
  7. Respaldo diario:   crontab -e  →  30 2 * * * $DIR/deploy/respaldar.sh >> /var/log/helpdesk-respaldo.log 2>&1
=============================================================================
EOF
