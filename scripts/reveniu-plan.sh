#!/usr/bin/env bash
# Crea (una sola vez por ambiente) el plan mensual de Astros x Chat en Reveniu.
# El id que devuelve va a la env REVENIU_PLAN_ID de Convex.
#
# Sandbox:
#   REVENIU_API_SECRET=$REVENIU_API_SECRET_SANDBOX \
#   REVENIU_API_URL=https://integration.reveniu.com ./scripts/reveniu-plan.sh
# Producción:
#   REVENIU_API_SECRET=$REVENIU_API_SECRET \
#   REVENIU_API_URL=https://production.reveniu.com ./scripts/reveniu-plan.sh
set -euo pipefail

: "${REVENIU_API_SECRET:?falta REVENIU_API_SECRET}"
: "${REVENIU_API_URL:?falta REVENIU_API_URL}"
: "${WEB_BASE_URL:=https://aquelarre-xi.vercel.app}"
: "${PLAN_TITLE:=Astros x Chat}"
: "${PLAN_PRICE:=3000}"

# frequency 3 = Monthly. cicles 1 + auto_renew = suscripción indefinida (así lo modela
# Reveniu: un plan indefinido y autorrenovable siempre reporta cicles 1).
# is_custom_amount deja que el monto lo mande cada suscripción, para que el precio siga
# viviendo en la tabla `settings` de Convex y se edite desde /admin.
curl -sS -X POST "${REVENIU_API_URL}/api/v1/plans/" \
  -H "Reveniu-Secret-Key: ${REVENIU_API_SECRET}" \
  -H "Content-Type: application/json" \
  --data @- <<JSON
{
  "frequency": 3,
  "cicles": 1,
  "title": "${PLAN_TITLE}",
  "description": "Conversación ilimitada con tu oráculo por Telegram",
  "price": ${PLAN_PRICE},
  "is_custom_amount": true,
  "custom_amount_min": 1000,
  "custom_amount_max": 200000,
  "auto_renew": true,
  "redirect_to": "${WEB_BASE_URL}/suscripcion/listo",
  "redirect_to_failure": "${WEB_BASE_URL}/checkout?error=pago"
}
JSON
