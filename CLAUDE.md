# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado actual

Pre-código. El repo contiene solo `Definiciones_Proyecto_Chat_IA_Astrologos.md` (la spec viva) y `.env` (`FIREWORKS_API`). No hay scaffold, ni comandos de build/test/lint todavía. El siguiente paso es crear el proyecto Convex y el scaffold del motor conversacional. La spec es la fuente de verdad; al construir, actualízala.

## Qué se está construyendo

Bot de Telegram donde cada usuario habla en privado con un "oráculo" (persona de IA astróloga) tras un paywall de suscripción mensual. Audiencia: Chile. Fase 1 = solo el motor conversacional ("corazón primero"): **el paywall se omite a propósito**, se deja un stub de acceso para enchufar Flow (pagos) después.

## Stack

- **Backend + DB:** Convex — sistema único de registro. Reemplaza servidor *y* base de datos.
- **LLM:** Fireworks (API; modelo abierto por definir, candidatos Qwen/Llama con buen español).
- **Canal:** Telegram vía webhook.
- Fuera de alcance en Fase 1: Flow (pagos), frontend Next.js/Vercel, WhatsApp.

## Arquitectura

Webhook-native, sin polling ni proceso always-on. Todo el flujo vive dentro de Convex:

```
Telegram → POST /telegram (httpAction en <deployment>.convex.site)
         → mutation: guarda mensaje entrante (por chat_id)
         → action: llama a Fireworks con [system prompt + historial]
         → mutation: guarda la respuesta
         → Telegram sendMessage
```

**Aislamiento por `chat_id`:** cada mensaje de Telegram trae un `chat_id` numérico único y estable. Todo el historial y estado se indexa por `chat_id` — no se construyen "salas". No usar teléfono/E.164 como clave (fue el bug #1 de la spec original con WhatsApp).

**Modelo de datos mínimo (Convex):**
- `conversations` — una por `chat_id`; estado de sesión, datos astrológicos derivados (solar/lunar/ascendente), oráculo activo, timestamp.
- `messages` — historial por conversación (rol, contenido, timestamp); contexto por ventana deslizante de N turnos o presupuesto de tokens.
- `consent` — consentimiento explícito (Ley 21.719), fecha y versión.

**Sesión:** dos niveles — relación continua (historial persistente) y consulta discreta reiniciable con `/nueva`.

## Restricciones no obvias (respétalas)

- **Un solo oráculo primero.** Lograr uno bien antes de armar los 2-3 definitivos. Cada oráculo = system prompt (personalidad) + carta natal derivada del consultante + contexto astrológico actual (tránsitos/luna/retrógrados, candidato a cron diario en Convex) + historial reciente.
- **Minimización de datos:** al LLM se envían **solo datos astrológicos derivados** (signos, casas, tránsitos), nunca datos identificables. Fireworks es empresa de EE.UU. → cada llamada es transferencia internacional de datos.
- **Ley 21.719 (vigente 1-dic-2026):** la astrología roza "datos sensibles" (creencias). Requiere flujo de **consentimiento explícito antes de la primera interacción**. La fuente única en Convex existe para que la supresión ("borrar todo dato de un usuario") sea una operación en un solo sistema.
- **Escape regulatorio futuro:** Ollama self-hosted elimina la transferencia internacional si se necesita — mantener el LLM detrás de una interfaz reemplazable.
