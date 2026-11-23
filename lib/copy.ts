// Copy por defecto de las páginas públicas. Vive en código para que el sitio
// funcione con la BD vacía; la BD solo guarda overrides por clave.
// Sin "server-only": el editor del admin (Client Component) importa este mismo archivo.
//
// Los textos son los de Esteban (marketing, repo ElCopyPaste/silente-web), con dos ajustes
// de veracidad: el beneficio «Conversación ilimitada*» contradecía la cuota diaria de cada
// plan, y el FAQ de cobro ya no da por hecho que hay un solo plan. Precio, mensajes por día y
// beneficios de cada plan NO están acá: viven en la tabla `plans` (/admin → Planes).

export type CopyKind = "text" | "long" | "image" | "bool";
export type CopyDef = { key: string; label: string; kind: CopyKind; def: string };

// Un `bool` guarda "sí" para encendido y "" para apagado. Vacío borra el override, así que
// un bool con default "sí" no se puede apagar guardando "": se guarda "no".
export const encendido = (v: string) => v.trim().toLowerCase() === "sí";

// ponytail: la cantidad de preguntas, beneficios y testimonios es fija. Agregar o quitar
// ítems requiere editar este archivo y el componente. Upgrade: si marketing pide listas de
// largo variable, mover esos bloques a una tabla propia en Convex.
export const COPY_GROUPS: { page: string; label: string; items: CopyDef[] }[] = [
  {
    page: "home",
    label: "Portada",
    items: [
      { key: "home.hero.titulo", label: "Hero: título (antes de la palabra que alterna)", kind: "text", def: "Hay cosas que necesitas" },
      { key: "home.hero.palabra1", label: "Hero: palabra 1", kind: "text", def: "saber." },
      { key: "home.hero.palabra2", label: "Hero: palabra 2", kind: "text", def: "hablar." },
      { key: "home.hero.frase1", label: "Hero: frase con la palabra 1", kind: "text", def: "Silente te espera." },
      { key: "home.hero.frase2", label: "Hero: frase con la palabra 2", kind: "text", def: "Silente te escucha." },
      {
        key: "home.hero.intro",
        label: "Hero: bajada",
        kind: "long",
        def: "Conversa con Luna por WhatsApp. Pregúntale por tu horóscopo y por lo que quieras saber sobre amor, dinero, trabajo y suerte.",
      },
      { key: "home.hero.pregunta.1", label: "Hero: pregunta 1", kind: "text", def: "¿Qué siente realmente por mí?" },
      { key: "home.hero.pregunta.2", label: "Hero: pregunta 2", kind: "text", def: "¿Estoy tomando la decisión correcta?" },
      { key: "home.hero.pregunta.3", label: "Hero: pregunta 3", kind: "text", def: "¿Acaso me está engañando?" },
      { key: "home.hero.pregunta.4", label: "Hero: pregunta 4", kind: "text", def: "¿Qué me pasará el próximo mes?" },
      { key: "home.hero.pregunta.5", label: "Hero: pregunta 5", kind: "text", def: "¿Encontraré el amor?" },
      { key: "home.hero.pregunta.6", label: "Hero: pregunta 6", kind: "text", def: "¿Por qué me va mal?" },
      { key: "home.hero.cta", label: "Hero: botón", kind: "text", def: "Chatear con Silente" },
      { key: "home.hero.beneficio.1", label: "Hero: beneficio 1", kind: "text", def: "Conversación todos los días" },
      { key: "home.hero.beneficio.2", label: "Hero: beneficio 2", kind: "text", def: "Disponible 24/7" },
      { key: "home.hero.beneficio.3", label: "Hero: beneficio 3", kind: "text", def: "Totalmente privada" },

      { key: "home.quees.eyebrow", label: "Qué es: antetítulo", kind: "text", def: "Qué es Silente" },
      { key: "home.quees.titulo", label: "Qué es: título", kind: "text", def: "Una conversación para encontrar claridad." },
      {
        key: "home.quees.parrafo1",
        label: "Qué es: párrafo 1",
        kind: "long",
        def: "Silente te ofrece un espacio para explorar tus preguntas sobre amor, relaciones, decisiones y futuro. Sus lecturas se inspiran en la videncia, la astrología y distintas mancias, y consideran tu carta natal y los tránsitos planetarios.",
      },
      {
        key: "home.quees.parrafo2",
        label: "Qué es: párrafo 2",
        kind: "long",
        def: "Luna es la guía digital de Silente. Conversa con ella por WhatsApp, en privado y a tu ritmo. Haz una pregunta, profundiza en su respuesta y abre nuevos temas cuando quieras.",
      },
      { key: "home.quees.video.eyebrow", label: "Qué es: antetítulo del video", kind: "text", def: "Una conversación por WhatsApp" },
      {
        key: "home.quees.video.url",
        label: "Qué es: video demo (URL de un .mp4; vacío = espacio reservado)",
        kind: "text",
        def: "",
      },
      { key: "home.quees.video.titulo", label: "Qué es: título del espacio reservado", kind: "text", def: "Demo de conversación por WhatsApp" },
      { key: "home.quees.video.sub", label: "Qué es: subtítulo del espacio reservado", kind: "text", def: "Espacio reservado para el video" },

      { key: "home.plan.eyebrow", label: "Plan: antetítulo", kind: "text", def: "Elige tu plan" },
      { key: "home.plan.titulo", label: "Plan: título", kind: "text", def: "Un espacio para conversar cuando lo necesitas." },
      {
        key: "home.plan.parrafo",
        label: "Plan: párrafo",
        kind: "long",
        def: "Acceso a una experiencia de astrología conversada, en privado y desde WhatsApp.",
      },
      { key: "home.plan.cta", label: "Plan: botón", kind: "text", def: "Suscribirme" },
      { key: "home.plan.nota", label: "Plan: nota bajo el botón", kind: "text", def: "Cobro mensual recurrente mediante Reveniu." },

      { key: "home.faq.eyebrow", label: "FAQ: antetítulo", kind: "text", def: "Antes de empezar" },
      { key: "home.faq.titulo", label: "FAQ: título", kind: "text", def: "Pregunta lo que necesites." },
      {
        key: "home.faq.parrafo",
        label: "FAQ: párrafo",
        kind: "long",
        def: "Queremos que sepas qué experiencia te espera antes de conversar con Silente.",
      },
      { key: "home.faq.1.pregunta", label: "FAQ 1: pregunta", kind: "text", def: "¿Me responde una persona?" },
      {
        key: "home.faq.1.respuesta",
        label: "FAQ 1: respuesta",
        kind: "long",
        def: "No es un chat con un astrólogo en vivo. Silente es una experiencia interactiva construida a partir del conocimiento de astrólogos y de su forma de interpretar.",
      },
      { key: "home.faq.2.pregunta", label: "FAQ 2: pregunta", kind: "text", def: "¿Cómo funciona la conversación?" },
      {
        key: "home.faq.2.respuesta",
        label: "FAQ 2: respuesta",
        kind: "long",
        def: "Después de activar tu suscripción, conversas con Silente por WhatsApp. Puedes plantear tus preguntas y continuar el diálogo cuando quieras.",
      },
      { key: "home.faq.3.pregunta", label: "FAQ 3: pregunta", kind: "text", def: "¿Qué pasa con mis conversaciones?" },
      {
        key: "home.faq.3.respuesta",
        label: "FAQ 3: respuesta",
        kind: "long",
        def: "Tus conversaciones son privadas y confidenciales. No compartimos tus lecturas ni tus datos personales con terceros, y puedes borrar tu historial cuando quieras desde «Mi cuenta».",
      },
      { key: "home.faq.4.pregunta", label: "FAQ 4: pregunta", kind: "text", def: "¿Cómo se cobra y puedo cancelar?" },
      {
        key: "home.faq.4.respuesta",
        label: "FAQ 4: respuesta",
        kind: "long",
        def: "Los planes son mensuales y el pago recurrente se realiza mediante Reveniu. Puedes cancelar cuando quieras, sin permanencia.",
      },

      {
        key: "home.testimonios.mostrar",
        label: "Testimonios: mostrar la sección (apagar si no son reales)",
        kind: "bool",
        def: "sí",
      },
      { key: "home.testimonios.eyebrow", label: "Testimonios: antetítulo", kind: "text", def: "Una experiencia para compartir" },
      { key: "home.testimonios.titulo", label: "Testimonios: título", kind: "text", def: "Lo que podría contarte alguien como tú." },
      ...[
        ["Carlos, 30 años", "La lectura me ayudó a poner en perspectiva una decisión que venía postergando. Me sentí acompañado y pude ordenar mis ideas."],
        ["Verónica, 40 años", "Me sorprendió lo clara y cercana que fue la conversación. Pude preguntar a mi ritmo y volver sobre lo que necesitaba."],
        ["Martina, 22 años", "Llegué con muchas dudas sobre mi relación y la lectura me ayudó a mirar lo que estaba sintiendo con más calma."],
        ["Elena, 63 años", "Me gustó poder conversar en privado y sin apuro. Cada respuesta me dio una nueva perspectiva para reflexionar."],
      ].flatMap(([nombre, cita], i): CopyDef[] => [
        { key: `home.testimonios.${i + 1}.nombre`, label: `Testimonio ${i + 1}: nombre`, kind: "text", def: nombre },
        { key: `home.testimonios.${i + 1}.foto`, label: `Testimonio ${i + 1}: foto`, kind: "image", def: `/testimonials/portrait-0${i + 1}.jpg` },
        { key: `home.testimonios.${i + 1}.cita`, label: `Testimonio ${i + 1}: cita`, kind: "long", def: cita },
      ]),
    ],
  },
];

// Nombre visible de cada sección para las pestañas del admin. La sección de una clave
// es su segundo segmento ("home.faq.1.pregunta" → "home.faq"); si falta acá, la pestaña
// muestra el segmento crudo, así que agregar claves nuevas nunca rompe el editor.
export const SECTION_LABELS: Record<string, string> = {
  "home.hero": "Hero",
  "home.quees": "Qué es Silente",
  "home.plan": "Elige tu plan",
  "home.faq": "Preguntas frecuentes",
  "home.testimonios": "Testimonios",
};

export const COPY_DEFAULTS: Record<string, string> = Object.fromEntries(
  COPY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.def])),
);
