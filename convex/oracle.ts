import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { buildSystemPrompt, DEFAULT_ORACLE, FALLBACK_SYSTEM } from "./personas";
import { bloqueCielo } from "./cielo";
import { send } from "./send";

// Modelo vía env FIREWORKS_MODEL; este default es el respaldo.
// Historia: gpt-oss-120b se usó hasta que Fireworks lo deprecó (2026-11-07) y le quitó el
// serverless: desde entonces responde 404 "Model not found ... not deployed" y Luna quedaba
// "en silencio". El 2026-11-25 se pasó a deepseek-v4p1-flash tras probar 5 candidatos con el
// prompt real (3,4 s, español neutro, usa la carta). Con reasoning_effort "low" todos los
// candidatos (deepseek, glm, kimi, qwen) separan el razonamiento en `reasoning_content` y
// dejan `content` limpio; sin ese parámetro, kimi y glm agotan max_tokens razonando.
// Antes de cambiar de modelo: GET /v1/accounts/fireworks/models/<id> debe decir
// supportsServerless: true y sin deprecationDate.
const DEFAULT_MODEL = "accounts/fireworks/models/deepseek-v4p1-flash";
const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

export const respond = internalAction({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const convo = await ctx.runQuery(internal.messages.getConversation, { chatId });
    const history = await ctx.runQuery(internal.messages.recentMessages, { chatId });

    const slug = convo?.oracle ?? DEFAULT_ORACLE;
    const oracle = await ctx.runQuery(internal.oracles.getBySlug, { slug });
    const system = buildSystemPrompt(oracle?.system ?? FALLBACK_SYSTEM, convo?.astro, bloqueCielo());
    const body = {
      model: process.env.FIREWORKS_MODEL ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: system },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 800,
      temperature: 0.8,
      reasoning_effort: "low", // evita que el razonamiento desborde y ensucie la respuesta
    };

    const res = await fetch(FIREWORKS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIREWORKS_API}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      // Un 404 acá casi siempre es el modelo deprecado o sin serverless, no la clave (ver arriba).
      // 402/412 = sin créditos; 429 = límite de tasa.
      const detalle = `Fireworks ${res.status} (modelo ${body.model}): ${await res.text()}`;
      await ctx.scheduler.runAfter(0, internal.monitor.avisar, { key: `fireworks ${res.status}`, texto: detalle });
      await send(chatId, "El oráculo está en silencio por ahora. Intenta de nuevo en un momento.");
      throw new Error(detalle);
    }

    const data = await res.json();
    // Lee content (la respuesta); descarta cualquier bloque <think> por si se filtra.
    const reply =
      (data.choices?.[0]?.message?.content ?? "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim() || "…";
    await ctx.runMutation(internal.messages.addMessage, {
      chatId,
      role: "assistant",
      content: reply,
    });
    try {
      await send(chatId, reply);
    } catch (e) {
      // Token de Meta vencido, número bloqueado o sin método de pago: el usuario no recibe nada.
      await ctx.scheduler.runAfter(0, internal.monitor.avisar, { key: "whatsapp envío", texto: String(e) });
      throw e;
    }
  },
});
