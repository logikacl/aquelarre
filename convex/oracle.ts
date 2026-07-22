import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { buildSystemPrompt, DEFAULT_ORACLE, FALLBACK_SYSTEM } from "./personas";
import { sendTelegram } from "./telegram";

// gpt-oss-120b con reasoning_effort "low": único de la cuenta que separa el
// razonamiento y responde limpio. Cambiar vía env FIREWORKS_MODEL (pregunta abierta #1).
// OJO: kimi/glm vuelcan su scratchpad al content — no sirven aquí sin más manejo.
const DEFAULT_MODEL = "accounts/fireworks/models/gpt-oss-120b";
const FIREWORKS_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

export const respond = internalAction({
  args: { chatId: v.number() },
  handler: async (ctx, { chatId }) => {
    const convo = await ctx.runQuery(internal.messages.getConversation, { chatId });
    const history = await ctx.runQuery(internal.messages.recentMessages, { chatId });

    const slug = convo?.oracle ?? DEFAULT_ORACLE;
    const oracle = await ctx.runQuery(internal.oracles.getBySlug, { slug });
    const system = buildSystemPrompt(oracle?.system ?? FALLBACK_SYSTEM, convo?.astro);
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
      await sendTelegram(chatId, "El oráculo está en silencio por ahora. Intenta de nuevo en un momento.");
      throw new Error(`Fireworks ${res.status}: ${await res.text()}`);
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
    await sendTelegram(chatId, reply);
  },
});
