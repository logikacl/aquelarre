#!/usr/bin/env bash
# Fija la URL de eventos (webhook) de la cuenta Reveniu.
#
# No se puede con el API secret: los endpoints de perfil piden el JWT del panel, así que
# esto hace el mismo login que hace la web de Reveniu y llama los mismos dos endpoints
# (`get_webhook_url` / `edit_webhook_url`). El campo también está en el panel, en la misma
# pantalla donde se genera el API secret — esto existe para no tener que buscarlo a mano y
# para poder repetirlo en producción.
#
# OJO: son DOS cuentas Reveniu distintas, con login propio y URL de eventos propia.
#   sandbox.reveniu.com          -> REVENIU_API_URL=https://integration.reveniu.com
#   app.reveniu.com (producción) -> REVENIU_API_URL=https://production.reveniu.com
# Fijar la URL en una NO la fija en la otra. Las credenciales son las del PANEL
# (correo + contraseña con que entras a la web), no el API secret.
#
# Leer sin escribir:
#   SOLO_LEER=1 REVENIU_PANEL_EMAIL=... REVENIU_PANEL_PASSWORD=... \
#   REVENIU_API_URL=https://integration.reveniu.com ./scripts/reveniu-webhook.sh
# Fijarla (sandbox):
#   REVENIU_PANEL_EMAIL=... REVENIU_PANEL_PASSWORD=... \
#   REVENIU_API_URL=https://integration.reveniu.com ./scripts/reveniu-webhook.sh
set -euo pipefail

: "${REVENIU_PANEL_EMAIL:?falta REVENIU_PANEL_EMAIL (el correo con que entras al panel)}"
: "${REVENIU_PANEL_PASSWORD:?falta REVENIU_PANEL_PASSWORD}"
: "${REVENIU_API_URL:?falta REVENIU_API_URL}"
: "${WEBHOOK_URL:=https://utmost-starfish-607.convex.site/reveniu}"

# El panel baja el correo a minúsculas antes de mandarlo; si no, el login falla.
json() { python3 -c 'import json,sys; print(json.dumps(dict(zip(sys.argv[1::2], sys.argv[2::2]))))' "$@"; }
field() { python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1],""))' "$1"; }

TOKEN=$(curl -sS -X POST "${REVENIU_API_URL}/api/user/login/" \
  -H "Content-Type: application/json" \
  --data "$(json email "$(echo "$REVENIU_PANEL_EMAIL" | tr '[:upper:]' '[:lower:]')" password "$REVENIU_PANEL_PASSWORD")" \
  | field token)

[ -n "$TOKEN" ] || { echo "login rechazado: revisa correo y contraseña del panel" >&2; exit 1; }

leer() { curl -sS -H "Authorization: JWT $TOKEN" \
  "${REVENIU_API_URL}/api/profiles/profile/get_webhook_url/" | field webhook_url; }

echo "cuenta:  ${REVENIU_API_URL}"
echo "antes:   [$(leer)]"
[ -n "${SOLO_LEER:-}" ] && exit 0

curl -sS -X POST "${REVENIU_API_URL}/api/profiles/profile/edit_webhook_url/" \
  -H "Authorization: JWT $TOKEN" -H "Content-Type: application/json" \
  --data "$(json webhook_url "$WEBHOOK_URL")" > /dev/null

echo "después: [$(leer)]"
