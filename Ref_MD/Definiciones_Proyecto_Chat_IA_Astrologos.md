# Definiciones del Proyecto: Chat IA — Astrólogos por Telegram
**Última actualización:** 2026-07-17
**Estado:** Fase 1 — Motor conversacional ("corazón primero")

---

## 1. Qué es

Servicio conversacional por mensajería donde cada usuario habla en privado con un "oráculo": personas de IA (astrólogos con personalidades distintas) detrás de un paywall por suscripción mensual recurrente.

- **Audiencia:** Chile
- **Canal inicial:** Telegram (WhatsApp en fase posterior)
- **Modelo de negocio:** suscripción mensual, cobros con Flow (fase posterior)

---

## 2. Stack definido

| Capa | Decisión | Estado |
|---|---|---|
| **Backend + base de datos** | **Convex** (sistema único de registro) | ✅ Definido — plan de pago activo |
| **LLM** | **Fireworks** (API, modelo abierto a definir) | ✅ Definido para Fase 1 |
| **Canal** | **Telegram** vía webhook | ✅ Definido |
| **Pagos** | Flow | ⏸ Fase posterior |
| **Frontend** | Next.js en Vercel | ⏸ Pendiente (fuera de alcance actual) |

**Cambio respecto a la spec original:** se descartó NestJS + Supabase para el bot. Convex reemplaza tanto el servidor como la base de datos. Razón: un bot de Telegram es webhook-native, y Convex trae endpoint HTTP, base de datos, scheduler y actions en un solo lugar, siempre disponible y sin proceso que mantener encendido.

---

## 3. Arquitectura

### Webhook-native (sin polling, sin servidor always-on)
Telegram hace POST a una HTTP action de Convex (`https://<deployment>.convex.site/telegram`) cada vez que llega un mensaje. No hay proceso vivo que mantener; Convex está siempre disponible.

### Flujo del oráculo (todo dentro de Convex)
```
Telegram → POST /telegram (httpAction)
         → mutation: guarda el mensaje entrante (por chat_id)
         → action: llama a Fireworks con [system prompt + historial]
         → mutation: guarda la respuesta
         → llamada a Telegram sendMessage
```

### Sesión privada por usuario
El aislamiento es automático: cada mensaje de Telegram llega con un `chat_id` único, estable y numérico. Todo el historial y estado se indexa por `chat_id`, así que ninguna sesión ve ni contamina la de otro. No hace falta construir "salas".

Ventaja adicional: el `chat_id` numérico elimina la normalización E.164 (fuente de bugs #1 en la spec original con WhatsApp).

### Concepto de "sesión"
Se soportan dos niveles:
- **Relación continua** del usuario con el oráculo (historial persistente)
- **Consulta discreta** reiniciable con un comando (`/nueva`) para "empezar una lectura nueva"

---

## 4. Estrategia de desarrollo: corazón primero

Validada por Consejo LLM (5 asesores + peer review + síntesis). Consenso:

1. **Paso 1 (actual):** construir el motor conversacional (bot + IA + sistema de personas/oráculos) y probarlo en Telegram
2. **Paso 2:** incorporar pagos (Flow) y frontend
3. **Paso 3:** migrar/agregar WhatsApp

Lógica: si el corazón no engancha, nada más importa. El paywall/gating se **omite a propósito** en Fase 1; se deja un stub de "acceso" para enchufar Flow después.

---

## 5. Modelo de datos mínimo (Convex)

Punto de partida (a refinar en el scaffold):

- **`conversations`** — una por `chat_id`; estado de sesión, datos astrológicos derivados del usuario (signos solar/lunar/ascendente), oráculo activo, timestamp
- **`messages`** — historial por conversación (rol, contenido, timestamp); ventana deslizante de N turnos o presupuesto de tokens para el contexto
- **`consent`** — registro de consentimiento explícito (Ley 21.719), fecha y versión

**Principio de fuente única:** al vivir todo en Convex, cumplir el derecho de supresión ("borrar todo dato de un usuario a pedido") es una operación en un solo sistema, no dos.

---

## 6. Personas / Oráculos

Cada oráculo requiere:
- **System prompt** con personalidad y estilo
- **Datos del consultante** — carta natal derivada (signos, casas)
- **Contexto astrológico actual** — tránsitos, luna, retrógrados (candidato a cron/scheduler diario en Convex)
- **Historial reciente** de la conversación

**Enfoque:** empezar con **un solo oráculo** bien logrado antes de armar los 2-3 definitivos.

---

## 7. Regulación: Ley 21.719

Entra en vigencia el **1 de diciembre de 2026**. Crea la Agencia de Protección de Datos Personales (APDP), con facultades de fiscalización y sanción. Multas hasta 20.000 UTM (~$1.400M CLP); reincidencia hasta 4% de ingresos anuales.

### Puntos críticos
1. **Datos sensibles:** la ley clasifica como sensibles los datos que revelan "convicciones ideológicas o filosóficas" y "creencias religiosas". La astrología cae en zona gris; las conversaciones acumulan datos sensibles. Requiere **consentimiento explícito y reforzado** antes de la primera interacción.
2. **Transferencia internacional:** **Fireworks es empresa de EE.UU.**, por lo que enviarle conversaciones es transferencia internacional — misma categoría que OpenAI/Anthropic. Requiere base legal + DPA. Aceptable en Fase 1, pero el ítem **no desaparece** con Fireworks. La vía que lo elimina de raíz sigue siendo self-hosting (Ollama), como opción para una fase posterior.
3. **Derechos del titular:** 6 derechos (acceso, rectificación, supresión, oposición, portabilidad, bloqueo). Brechas notificadas en 72 horas.

### Decisiones de diseño por regulación
- **Minimización:** enviar al LLM solo datos astrológicos derivados (signos, casas, tránsitos), nunca datos identificables
- **Consentimiento:** flujo explícito antes de la primera interacción
- **Fuente única (Convex):** simplifica supresión y auditoría
- **Escape regulatorio futuro:** Ollama self-hosted elimina la transferencia internacional si se necesita

---

## 8. Próximos pasos

- [ ] Definir el modelo de Fireworks para el oráculo (candidatos: Qwen o Llama grandes con buen español)
- [ ] Crear el proyecto en Convex
- [ ] Scaffold del motor: esquema (`conversations`, `messages`, `consent`), httpAction `/telegram`, action a Fireworks, un oráculo de ejemplo
- [ ] Crear el bot con @BotFather y configurar el webhook
- [ ] Diseñar el system prompt del primer oráculo
- [ ] Definir el flujo de consentimiento (Ley 21.719)

---

## 9. Preguntas abiertas

- ¿Qué modelo de Fireworks da mejor consistencia de personaje en español en conversaciones largas?
- ¿Se necesita memoria entre sesiones, o basta el contexto de sesión? (Convex tiene búsqueda vectorial propia si se requiere)
- ¿Fine-tuning de un modelo abierto para los oráculos vale la pena vs. prompt engineering?
- ¿Qué comando(s) y UX de sesión (`/nueva`, `/start`, onboarding de carta natal)?

---

#proyecto/chat-ia #astrología #telegram #convex #fireworks #ley-21719 #privacidad #llm #chile #saas #mvp
