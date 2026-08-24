// Copy por defecto de las páginas públicas. Vive en código para que el sitio
// funcione con la BD vacía; la BD solo guarda overrides por clave.
// Sin "server-only": el editor del admin (Client Component) importa este mismo archivo.

export type CopyKind = "text" | "long" | "image";
export type CopyDef = { key: string; label: string; kind: CopyKind; def: string };

// ponytail: la cantidad de bullets, pasos y preguntas del FAQ es fija. Agregar o
// quitar ítems requiere editar este archivo y el JSX. Upgrade: si el cliente pide
// listas de largo variable, mover esos bloques a una tabla propia en Convex.
export const COPY_GROUPS: { page: string; label: string; items: CopyDef[] }[] = [
  {
    page: "home",
    label: "Portada",
    items: [
      {
        key: "home.hero.imagen",
        label: "Hero — imagen de fondo (URL)",
        kind: "image",
        def: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRjZeQfZHnA0yX0Uw_eZ2_E_ppxCFoX1Lchmss_Jx3gFAuZijsbCWcyb32AvNf-gtvJMmGGn9Cd-kddJS2cw4ViKJl9BCL2ttkN7SkRwqQJgG1TydXy3X8XJc3Gbfwc_XlHRoP24-C-HbCzcqbQAxJzMT7LfurUkm8xwbOzlUaFD2rbbQ1QvhsQSaKIkdz3lhUCnPc1jz2HeAtiXiCvWBJP_e7dMXmYo1RIZlLppcpoy-E_sLzrwON0g",
      },
      { key: "home.hero.badge", label: "Hero — etiqueta superior", kind: "text", def: "Tu guía celestial 24/7" },
      { key: "home.hero.titulo1", label: "Hero — título (línea 1)", kind: "text", def: "Tu destino escrito" },
      { key: "home.hero.titulo2", label: "Hero — título (línea 2, destacada)", kind: "text", def: "en las estrellas" },
      {
        key: "home.hero.parrafo",
        label: "Hero — párrafo",
        kind: "long",
        def: "Recibe sabiduría ancestral a través de Telegram. Una inmersión interactiva con los astrólogos más influyentes, disponible en cualquier momento.",
      },
      { key: "home.hero.cta1", label: "Hero — botón principal", kind: "text", def: "Comenzar Lectura" },
      { key: "home.hero.cta2", label: "Hero — botón secundario", kind: "text", def: "Saber Más" },

      { key: "home.proceso.eyebrow", label: "Cómo funciona — antetítulo", kind: "text", def: "El Proceso" },
      { key: "home.proceso.titulo", label: "Cómo funciona — título", kind: "text", def: "Conexión instantánea" },
      { key: "home.proceso.1.numero", label: "Paso 1 — número", kind: "text", def: "01" },
      { key: "home.proceso.1.titulo", label: "Paso 1 — título", kind: "text", def: "Elige tu Guía Astral" },
      {
        key: "home.proceso.1.texto",
        label: "Paso 1 — descripción",
        kind: "long",
        def: "Contamos con expertos en diferentes ramas de la astrología: védica, occidental, kármica y predictiva.",
      },
      { key: "home.proceso.2.numero", label: "Paso 2 — número", kind: "text", def: "02" },
      { key: "home.proceso.2.titulo", label: "Paso 2 — título", kind: "text", def: "Por Telegram" },
      {
        key: "home.proceso.2.texto",
        label: "Paso 2 — descripción",
        kind: "long",
        def: "Sin aplicaciones pesadas. Todo sucede en tu chat favorito, con total privacidad.",
      },
      { key: "home.proceso.3.numero", label: "Paso 3 — número", kind: "text", def: "03" },
      { key: "home.proceso.3.titulo", label: "Paso 3 — título", kind: "text", def: "24/7 Disponible" },
      {
        key: "home.proceso.3.texto",
        label: "Paso 3 — descripción",
        kind: "long",
        def: "El cosmos no descansa, y nosotros tampoco. Recibe respuestas al instante.",
      },
      { key: "home.proceso.4.numero", label: "Paso 4 — número", kind: "text", def: "04" },
      { key: "home.proceso.4.titulo", label: "Paso 4 — título", kind: "text", def: "Reflexión Profunda" },
      {
        key: "home.proceso.4.texto",
        label: "Paso 4 — descripción",
        kind: "long",
        def: "No son respuestas genéricas. Son diálogos basados en tu carta astral y el tránsito actual de los planetas.",
      },

      { key: "home.astrologos.eyebrow", label: "Astrólogos — antetítulo", kind: "text", def: "Nuestros Expertos" },
      { key: "home.astrologos.titulo", label: "Astrólogos — título", kind: "text", def: "Voces Espirituales" },
      {
        key: "home.astrologos.parrafo",
        label: "Astrólogos — párrafo",
        kind: "long",
        def: "Cada astrólogo tiene una especialidad única para ayudarte a navegar los desafíos de la vida moderna con la luz de los astros.",
      },

      { key: "home.planes.eyebrow", label: "Planes — antetítulo", kind: "text", def: "Membresías" },
      { key: "home.planes.titulo", label: "Planes — título", kind: "text", def: "Elige tu camino astral" },
      { key: "home.planes.etiqueta", label: "Planes — etiqueta de la tarjeta", kind: "text", def: "Suscripción mensual" },
      { key: "home.planes.nombre", label: "Planes — nombre del plan", kind: "text", def: "Acceso a tu oráculo" },
      { key: "home.planes.periodo", label: "Planes — período junto al precio", kind: "text", def: "/ mes" },
      { key: "home.planes.bullet.1", label: "Planes — bullet 1", kind: "text", def: "Conversación ilimitada por Telegram" },
      { key: "home.planes.bullet.2", label: "Planes — bullet 2", kind: "text", def: "Disponibilidad 24/7" },
      { key: "home.planes.bullet.3", label: "Planes — bullet 3", kind: "text", def: "Carta natal personalizada" },
      { key: "home.planes.cta", label: "Planes — botón", kind: "text", def: "Suscribirme" },

      { key: "home.faq.eyebrow", label: "FAQ — antetítulo", kind: "text", def: "Preguntas Frecuentes" },
      { key: "home.faq.titulo", label: "FAQ — título", kind: "text", def: "Dudas estelares" },
      {
        key: "home.faq.1.pregunta",
        label: "FAQ 1 — pregunta",
        kind: "text",
        def: "¿Es realmente una persona quien responde?",
      },
      {
        key: "home.faq.1.respuesta",
        label: "FAQ 1 — respuesta",
        kind: "long",
        def: "Es una experiencia interactiva avanzada basada en las obras y conocimientos reales de nuestros astrólogos. No es un chat humano en tiempo real, sino un sistema experto que utiliza la sabiduría documentada de los especialistas para responder con su voz y metodología exacta.",
      },
      { key: "home.faq.2.pregunta", label: "FAQ 2 — pregunta", kind: "text", def: "¿Mis datos están seguros?" },
      {
        key: "home.faq.2.respuesta",
        label: "FAQ 2 — respuesta",
        kind: "long",
        def: "Absolutamente. Todas las conversaciones son privadas y confidenciales. No compartimos tus lecturas ni datos personales con terceros, y puedes solicitar el borrado de tu historial en cualquier momento.",
      },
      { key: "home.faq.3.pregunta", label: "FAQ 3 — pregunta", kind: "text", def: "¿Cómo se realiza el pago?" },
      {
        key: "home.faq.3.respuesta",
        label: "FAQ 3 — respuesta",
        kind: "long",
        def: "Utilizamos Reveniu para cobros recurrentes mensuales. Puedes cancelar tu suscripción en cualquier momento sin compromisos de permanencia.",
      },
    ],
  },
  {
    page: "planes",
    label: "Planes",
    items: [
      { key: "planes.hero.titulo1", label: "Hero — título (parte 1)", kind: "text", def: "Un solo plan," },
      { key: "planes.hero.titulo2", label: "Hero — título (parte destacada)", kind: "text", def: "acceso completo" },
      {
        key: "planes.hero.parrafo",
        label: "Hero — párrafo",
        kind: "long",
        def: "Sin niveles ni letra chica. Suscríbete y conversa con tu oráculo por Telegram cuando lo necesites.",
      },

      { key: "planes.plan.etiqueta", label: "Plan — etiqueta", kind: "text", def: "Suscripción mensual" },
      { key: "planes.plan.nombre", label: "Plan — nombre", kind: "text", def: "Acceso a tu oráculo" },
      { key: "planes.plan.periodo", label: "Plan — período junto al precio", kind: "text", def: "/ mes" },
      {
        key: "planes.plan.bullet.1",
        label: "Plan — bullet 1",
        kind: "text",
        def: "Conversación 1:1 con tu oráculo por Telegram",
      },
      { key: "planes.plan.bullet.2", label: "Plan — bullet 2", kind: "text", def: "Historial continuo de tus consultas" },
      {
        key: "planes.plan.bullet.3",
        label: "Plan — bullet 3",
        kind: "text",
        def: "Carta natal derivada de tu nacimiento",
      },
      { key: "planes.plan.bullet.4", label: "Plan — bullet 4", kind: "text", def: "Disponible 24/7" },
      { key: "planes.plan.cta", label: "Plan — botón", kind: "text", def: "Suscribirme" },

      { key: "planes.incluye.titulo", label: "Qué incluye — título", kind: "text", def: "Qué incluye" },
      { key: "planes.incluye.1.emoji", label: "Qué incluye 1 — emoji", kind: "text", def: "💬" },
      { key: "planes.incluye.1.titulo", label: "Qué incluye 1 — título", kind: "text", def: "Sin esperas" },
      {
        key: "planes.incluye.1.texto",
        label: "Qué incluye 1 — descripción",
        kind: "long",
        def: "Tu oráculo responde en tu chat de Telegram, a cualquier hora del día.",
      },
      { key: "planes.incluye.2.emoji", label: "Qué incluye 2 — emoji", kind: "text", def: "🔒" },
      { key: "planes.incluye.2.titulo", label: "Qué incluye 2 — título", kind: "text", def: "Privacidad" },
      {
        key: "planes.incluye.2.texto",
        label: "Qué incluye 2 — descripción",
        kind: "long",
        def: "Conversaciones privadas, aisladas por chat y nunca compartidas con terceros.",
      },
      { key: "planes.incluye.3.emoji", label: "Qué incluye 3 — emoji", kind: "text", def: "🪐" },
      { key: "planes.incluye.3.titulo", label: "Qué incluye 3 — título", kind: "text", def: "Contexto real" },
      {
        key: "planes.incluye.3.texto",
        label: "Qué incluye 3 — descripción",
        kind: "long",
        def: "Respuestas basadas en tu carta natal derivada y el tránsito astral actual.",
      },
      { key: "planes.incluye.4.emoji", label: "Qué incluye 4 — emoji", kind: "text", def: "🗂️" },
      { key: "planes.incluye.4.titulo", label: "Qué incluye 4 — título", kind: "text", def: "Memoria continua" },
      {
        key: "planes.incluye.4.texto",
        label: "Qué incluye 4 — descripción",
        kind: "long",
        def: "Retoma la conversación donde la dejaste, o empieza de cero con /nueva.",
      },
    ],
  },
  {
    page: "oraculo",
    label: "Perfil de oráculo",
    items: [
      // {nombre} se reemplaza por el nombre del oráculo al renderizar. Dejar el placeholder.
      {
        key: "oraculo.boton_suscripcion",
        label: "Botón de suscripción (usa {nombre})",
        kind: "text",
        def: "Suscribirme para hablar con {nombre}",
      },
      { key: "oraculo.cta.titulo", label: "CTA — título", kind: "text", def: "¿Listo para conocer tu destino?" },
      {
        key: "oraculo.cta.parrafo",
        label: "CTA — párrafo (usa {nombre})",
        kind: "long",
        def: "El universo habla un lenguaje que solo {nombre} puede traducir para ti hoy mismo.",
      },
      { key: "oraculo.cta.boton", label: "CTA — botón", kind: "text", def: "Comenzar Lectura Ahora" },
    ],
  },
];

export const COPY_DEFAULTS: Record<string, string> = Object.fromEntries(
  COPY_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i.def])),
);
