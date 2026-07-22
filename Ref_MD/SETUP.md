# Puesta en marcha

Deployment: **`utmost-starfish-607`** · Bot: **@Sicorax_Bot** (Brujos01)
Webhook: `https://utmost-starfish-607.convex.site/telegram`

## 1. Instalar y arrancar Convex
```bash
npm install
npx convex dev      # usa el deployment de .env.local y genera convex/_generated
```
Deja `convex dev` corriendo mientras desarrollas.

## 2. Subir las variables de runtime a Convex
Las actions leen del entorno del deployment, no del `.env` del repo. Sube todo de una:
```bash
while IFS='=' read -r k v; do [ -n "$k" ] && [ "${k#\#}" = "$k" ] && npx convex env set "$k" "$v"; done < .env
```
Esto carga `FIREWORKS_API`, `FIREWORKS_MODEL`, `TELEGRAM_BOT_TOKEN` y `TELEGRAM_WEBHOOK_SECRET`.
Verifica con `npx convex env list`.

## 3. Registrar el webhook en Telegram
```bash
curl "https://api.telegram.org/bot8580232419:AAEyO-yK2gPIF0hhewxZ1lmJO-8gRd39n0A/setWebhook" \
  -d "url=https://utmost-starfish-607.convex.site/telegram" \
  -d "secret_token=ba4ec7d10632c319669beb1acaebc7ac1e9b85393dfd8912ab21bdfa9f20e20b"
```
Confirma con: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`

## 4. Probar
Abre [@Sicorax_Bot](https://t.me/Sicorax_Bot) en Telegram: `/start` → `/acepto` → conversa. `/nueva` reinicia la lectura.

## Deploy a producción
```bash
npx convex deploy
```
Es un deployment distinto al de dev: repite el paso 2 (`convex env set` con esas vars) y el paso 3 (webhook apuntando a la URL `.convex.site` de producción).
