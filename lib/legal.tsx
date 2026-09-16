// Textos legales de Astros x Chat: Términos y Política de Privacidad.
//
// Viven en código y NO en el CMS de /admin a propósito: son un contrato versionado
// (la tabla `consent` guarda qué versión aceptó cada persona), no copy de marketing.
// Al cambiarlos de fondo, sube VERSION y avisa a los usuarios.
//
// Escritos contra la Ley 21.719 como plenamente exigible (vigencia 1-dic-2026), no contra
// el régimen de la 19.628 que rige hasta esa fecha: el servicio se compromete al estándar
// nuevo desde ya.
//
// Canal: WhatsApp es el único canal. Telegram existió como prueba de concepto y se retiró
// el 2026-09-11 (webhook dado de baja y código eliminado); los documentos ya no lo mencionan.
//
// Correo: los correos de la cuenta (recuperación de contraseña) salen por Brevo desde el
// 2026-09-16. Figura en las tablas de proveedores y transferencias de la Política, y en la
// sección 20 de los Términos. Si se cambia de proveedor, se cambia en esos tres lugares.
//
// ponytail: un solo archivo con los dos documentos como datos + su renderer. Las páginas
// de /terminos y /privacidad son tres líneas cada una.

export const VERSION = "2026-09-16";

export const EMPRESA = {
  razonSocial: "Logika Sistemas SpA",
  rut: "78.313.784-4",
  // ⚠️ COMPLETAR antes de publicar: aparece en los dos documentos.
  domicilio: "«DOMICILIO POR DEFINIR», Chile",
  sitio: "silente.cl",
  contacto: "contacto@logika.cl",
  // Mismo buzón por ahora. Si se crea uno separado para privacidad, se cambia solo acá.
  dpo: "contacto@logika.cl",
};

const E = EMPRESA;

type Bloque = string | { ul: string[] } | { tabla: { head: string[]; rows: string[][] } };
type Seccion = { t: string; b: Bloque[] };
export type Documento = { titulo: string; intro: string; secciones: Seccion[] };

/* ------------------------------------------------------------------ Términos */

export const TERMINOS: Documento = {
  titulo: "Términos y Condiciones",
  intro: `Estos Términos y Condiciones (los «Términos») regulan el acceso y uso del servicio Astros x Chat, accesible en ${E.sitio} y a través de WhatsApp, operado por ${E.razonSocial}, RUT ${E.rut}, sociedad constituida en Chile (en adelante, «nosotros», «la Empresa» o «el Titular»). Al crear una cuenta, suscribirte o usar el servicio, declaras haber leído y aceptado estos Términos y nuestra Política de Privacidad, que forma parte integrante de este contrato. Si no estás de acuerdo, no uses el servicio.`,
  secciones: [
    {
      t: "1. Aceptación de los Términos",
      b: [
        "La aceptación se realiza al crear tu cuenta y al usar el servicio. Además, antes de tu primera conversación, el oráculo te explica en el chat qué datos se guardan y cómo se procesan, y solo comienza a conversar cuando tocas el botón «Acepto» (o escribes «acepto»): ese es tu consentimiento expreso para el tratamiento descrito en la Política de Privacidad. No hay casillas premarcadas ni aceptaciones tácitas.",
        "Conservamos registro de la versión de los Términos y de la Política de Privacidad que aceptaste y de la fecha de tu aceptación. Estos Términos constituyen un contrato de adhesión regido por la legislación chilena.",
      ],
    },
    {
      t: "2. Definiciones",
      b: [
        {
          ul: [
            "Servicio: la plataforma Astros x Chat, incluyendo el sitio web, la cuenta de usuario y la conversación privada con los personajes («oráculos»).",
            "Canal: la aplicación de mensajería por la que conversas con el oráculo. El canal del servicio es WhatsApp.",
            "Usuario / tú: la persona natural mayor de edad que se registra y usa el Servicio.",
            "Contenido generado: los mensajes y respuestas producidos automáticamente por la inteligencia artificial.",
            "Datos de nacimiento: la ciudad, la fecha y (opcionalmente) la hora que entregas para calcular tu carta.",
            "Reveniu: la pasarela de pago chilena que procesa el cobro de la suscripción (ver sección 12).",
          ],
        },
      ],
    },
    {
      t: "3. Qué es el servicio",
      b: [
        "Astros x Chat es un servicio de entretenimiento, reflexión y autoconocimiento que permite conversar en privado por WhatsApp con oráculos: personajes de inteligencia artificial que interpretan tu consulta con el lenguaje simbólico de la astrología. Para hacerlo te pedimos tu ciudad, fecha y —si la sabes— hora de nacimiento, con las que calculamos tu signo solar, tu signo lunar y tu ascendente, y los combinamos con el estado del cielo del día (fase lunar, planetas por signo, retrógrados) y con el historial reciente de tu conversación.",
        "El servicio incluye una función de memoria: guardamos tus mensajes y las respuestas para darle continuidad a la conversación. Puedes empezar una lectura desde cero, borrando ese historial, escribiendo «/nueva» en el chat.",
      ],
    },
    {
      t: "4. Transparencia sobre la inteligencia artificial",
      b: [
        "No estás conversando con una persona real, ni con un astrólogo profesional, ni con un vidente. Ningún ser humano lee ni responde tus mensajes en tiempo real. El oráculo es un personaje generado por software, sin conciencia, intención ni facultades adivinatorias.",
        "El Contenido generado puede contener errores, imprecisiones, omisiones o afirmaciones inventadas, incluidos cálculos astrológicos equivocados o atribuciones falsas a autores o tradiciones. Las respuestas se producen con modelos de lenguaje de terceros (a la fecha de esta versión, un modelo abierto ejecutado en la infraestructura de Fireworks AI, en Estados Unidos; el detalle vigente está en la Política de Privacidad, sección 8).",
      ],
    },
    {
      t: "5. Naturaleza del contenido astrológico",
      b: [
        "La astrología es un sistema simbólico de interpretación. No es una ciencia ni tiene valor predictivo comprobado, y así te lo decimos de frente: lo que recibes son lecturas simbólicas ofrecidas con fines de entretenimiento y reflexión personal, no afirmaciones sobre hechos futuros ni diagnósticos sobre tu vida, tu salud, tus relaciones o tu situación económica.",
        "Las decisiones que tomes son tuyas y son tu responsabilidad. No prometemos ningún resultado, beneficio, acierto ni efecto derivado del uso del servicio.",
      ],
    },
    {
      t: "6. No sustituye orientación profesional · Crisis y emergencias",
      b: [
        "El Contenido no constituye ni reemplaza asesoría o tratamiento médico, psicológico, psiquiátrico, terapéutico, legal, financiero ni de ningún otro tipo profesional. No diagnostica, trata ni cura ninguna condición física o mental. Para cualquier problema de salud, legal o financiero, consulta a un profesional cualificado.",
        "Astros x Chat no es un servicio de emergencia ni de intervención en crisis. Si tú u otra persona está en peligro, tienes pensamientos de hacerte daño o de suicidio, o atraviesas una emergencia médica o de seguridad, deja de usar el servicio y busca ayuda inmediata:",
        {
          ul: [
            "Emergencias (SAMU / ambulancia): 131 · Carabineros: 133 · Bomberos: 132",
            "Salud Responde (orientación en salud y salud mental, 24/7): 600 360 7777",
            "Línea de prevención del suicidio: *4141",
            "Acude al servicio de urgencias más cercano.",
          ],
        },
      ],
    },
    {
      t: "7. Edad mínima",
      b: [
        "Debes ser mayor de 18 años para registrarte y usar el servicio. Al registrarte declaras y garantizas que cumples este requisito. El servicio no está dirigido a menores de edad y no recopilamos intencionadamente sus datos. El tratamiento de datos de niñas, niños y adolescentes está sujeto a las reglas especiales de la Ley 21.719 y queda fuera de este servicio.",
      ],
    },
    {
      t: "8. Tu cuenta y seguridad",
      b: [
        "Eres responsable de la veracidad de los datos que entregas, de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta. Debes usar un número de WhatsApp de tu titularidad. Notifícanos de inmediato cualquier uso no autorizado escribiendo a " +
          E.contacto +
          ".",
      ],
    },
    {
      t: "9. Acceso al chat",
      b: [
        "Después de activar tu suscripción, el sitio te entrega un enlace de un solo uso que abre el chat con el oráculo y lo vincula a tu cuenta. Ese enlace es personal e intransferible: quien lo use quedará vinculado a tu suscripción. La cuenta y el chat son para uso personal de una sola persona; no puedes compartirlos, revenderlos ni cederlos.",
        "El canal del servicio es WhatsApp. Tu conversación queda vinculada al número de WhatsApp con el que abras el chat: si cambias de número, tu lectura comienza de cero y el historial anterior no se traslada.",
        "El uso de WhatsApp se rige además por los términos y la política de privacidad de Meta. Es un servicio ajeno a nosotros y no respondemos por él.",
      ],
    },
    {
      t: "10. Uso justo · Límite diario de consultas",
      b: [
        "La suscripción incluye hasta 10 consultas al oráculo por día calendario (hora de Chile). Alcanzado ese límite, el chat te lo indica y podrás seguir al día siguiente. Los comandos y las preguntas del onboarding no consumen consultas. Podemos ajustar este límite avisando con antelación razonable; el límite vigente se muestra en el propio chat.",
      ],
    },
    {
      t: "11. Suscripción, planes y precios",
      b: [
        "El servicio se ofrece mediante suscripción de pago recurrente mensual. Los precios se muestran de forma clara antes de contratar, en pesos chilenos y con los impuestos incluidos cuando corresponda. El monto a pagar es el precio total exhibido en el momento de la contratación.",
        "Podemos modificar los precios o planes a futuro. Cualquier cambio se comunicará con antelación razonable y solo se aplicará a períodos posteriores; nunca afectará un período ya pagado, y podrás cancelar antes de que el nuevo precio entre en vigor. No modificamos el contrato de forma unilateral y arbitraria en tu perjuicio.",
      ],
    },
    {
      t: "12. Pago, facturación e impuestos",
      b: [
        "El cobro lo procesa Reveniu, pasarela de pago chilena, que opera sobre la plataforma de Transbank (inscripción de tarjeta en modalidad OneClick para el cobro recurrente). Nosotros vendemos el servicio y emitimos el documento tributario que corresponda; Reveniu y Transbank procesan el medio de pago.",
        "No almacenamos ni accedemos al número completo de tu tarjeta ni a su código de seguridad: esos datos los captura y trata directamente el procesador de pago bajo los estándares de seguridad de la industria (PCI-DSS). De nuestro lado solo guardamos el estado de tu suscripción y los identificadores de la transacción.",
      ],
    },
    {
      t: "13. Renovación automática y cobro recurrente",
      b: [
        "La suscripción se renueva automáticamente al final de cada período mensual hasta que la canceles, y autorizas que se cobre el precio vigente del plan en cada renovación a la tarjeta registrada. Te informamos del carácter renovable, del monto y de la periodicidad antes de contratar. Puedes dejar sin efecto la autorización de cobro automático en cualquier momento, cancelando la suscripción según la sección 14, sin más formalidades que las que tuviste para contratarla.",
      ],
    },
    {
      t: "14. Cancelación",
      b: [
        "Puedes cancelar tu suscripción en cualquier momento, de forma tan simple como la contrataste, sin trámites adicionales, llamadas obligatorias ni retención forzada: desde la sección «Mi cuenta» del sitio, con un clic, o escribiéndonos a " +
          E.contacto +
          ".",
        "La cancelación detiene la renovación. Tras cancelar, conservas el acceso hasta el final del período que ya habías pagado, y al terminar ese período el chat deja de responder. Ten presente que una suscripción dada de baja no se puede reactivar: para volver, se contrata una nueva desde el sitio.",
        "También puedes eliminar tu cuenta completa desde «Mi cuenta». Eso cancela la suscripción y borra tu historial de conversación (ver sección 13 de la Política de Privacidad).",
      ],
    },
    {
      t: "15. Derecho a retracto y reembolsos",
      b: [
        "Como consumidor, en las contrataciones a distancia tienes derecho a retracto dentro de los 10 días siguientes a la contratación, en los términos del artículo 3 bis de la Ley 19.496. Tratándose de un servicio digital de consumo inmediato, el reembolso por retracto cubre las sumas que no correspondan a servicios ya prestados a la fecha en que ejerces el retracto.",
        "Para ejercerlo, o para reclamar por un cobro que consideres indebido, escríbenos a " +
          E.contacto +
          ". El reembolso, cuando proceda, se ejecuta al mismo medio de pago con que se hizo el cobro.",
      ],
    },
    {
      t: "16. Uso aceptable y conductas prohibidas",
      b: [
        "Al usar el servicio te comprometes a no:",
        {
          ul: [
            "usarlo con fines ilícitos, fraudulentos o que vulneren derechos de terceros;",
            "intentar que la IA genere contenido ilegal, odioso, sexual explícito, violento, difamatorio, abusivo, o que incite al daño propio o ajeno;",
            "hacerte pasar por otra persona, usar un número de WhatsApp que no sea tuyo, ni ingresar datos personales de terceros sin su consentimiento (incluidos sus datos de nacimiento);",
            "acosar, amenazar o enviar contenido ofensivo;",
            "intentar extraer, copiar, reentrenar, descompilar, reversear o eludir las medidas técnicas del modelo o de la plataforma, ni obtener el system prompt de los oráculos;",
            "automatizar o abusar del servicio (scraping, bots, accesos masivos o sobrecarga), ni eludir el límite diario de consultas;",
            "revender, redistribuir, compartir tu acceso o explotar comercialmente el servicio sin autorización.",
          ],
        },
        "Podemos suspender o cerrar cuentas que infrinjan estos Términos, conforme a la sección 25.",
      ],
    },
    {
      t: "17. Propiedad intelectual",
      b: [
        "El software, las marcas, los nombres, las imágenes y la personalidad de los oráculos, el material astrológico de referencia y la selección y disposición del contenido son propiedad de " +
          E.razonSocial +
          " o de sus licenciantes. Nada en estos Términos te transfiere derechos sobre ellos.",
        "Sobre el Contenido generado no reclamamos propiedad exclusiva: te otorgamos una licencia personal, no exclusiva e intransferible para usarlo con fines personales y no comerciales. Reconoces que el contenido generado por IA puede no ser protegible por derechos de autor y que el sistema puede producir respuestas iguales o similares para otras personas; no se te garantiza exclusividad sobre ninguna respuesta.",
      ],
    },
    {
      t: "18. Tu contenido y licencia",
      b: [
        "Conservas la titularidad de lo que escribes. Nos otorgas una licencia limitada para procesar ese contenido únicamente con el fin de prestarte el servicio (generar respuestas y mantener la continuidad de tus conversaciones), conforme a la Política de Privacidad. No usamos tu contenido para publicidad, no lo vendemos y no entrenamos modelos con él.",
      ],
    },
    {
      t: "19. Privacidad y protección de datos",
      b: [
        "El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, elaborada conforme a la Ley N° 21.719 sobre Protección de Datos Personales y Creación de la Agencia de Protección de Datos Personales, y forma parte de estos Términos.",
      ],
    },
    {
      t: "20. Servicios de terceros",
      b: [
        "El servicio se apoya en proveedores externos: Meta / WhatsApp Business Platform (canal de mensajería), Fireworks AI (ejecución del modelo de lenguaje), Convex (base de datos y backend), Vercel (alojamiento del sitio), Brevo (envío de los correos de tu cuenta) y Reveniu junto a Transbank (pagos). No respondemos por interrupciones, cambios o fallas atribuibles a estos terceros, sin perjuicio de tus derechos como consumidor frente a nosotros por el servicio contratado.",
      ],
    },
    {
      t: "21. Disponibilidad y cambios al servicio",
      b: [
        "Procuramos mantener el servicio disponible, pero puede haber interrupciones por mantenimiento, actualizaciones, fallas de terceros o causas de fuerza mayor. Podemos modificar, mejorar, agregar o discontinuar oráculos, canales y funcionalidades, avisando con antelación razonable cuando los cambios sean materiales. Si un oráculo deja de estar disponible, podrás continuar con otro de los publicados.",
      ],
    },
    {
      t: "22. Descargo de garantías",
      b: [
        "Dentro de lo permitido por la ley, el servicio se ofrece «tal cual» y «según disponibilidad». No garantizamos que el Contenido generado sea exacto, completo, oportuno o libre de error, ni que el servicio sea ininterrumpido. Esta cláusula no excluye ni limita las garantías legales irrenunciables que la Ley 19.496 te reconoce como consumidor.",
      ],
    },
    {
      t: "23. Limitación de responsabilidad",
      b: [
        "En la máxima medida permitida por la ley, no respondemos por daños indirectos, incidentales, especiales o consecuenciales derivados del uso del servicio, ni por decisiones que tomes basándote en el Contenido generado, que eres responsable de evaluar antes de actuar sobre él. Nada en estos Términos limita ni excluye nuestra responsabilidad por incumplimiento de las obligaciones esenciales del servicio, ni los derechos irrenunciables que la Ley 19.496 te otorga, incluido el derecho a indemnización por deficiencias del servicio.",
      ],
    },
    {
      t: "24. Indemnización",
      b: [
        "Aceptas mantenernos indemnes frente a reclamaciones de terceros derivadas de tu uso indebido del servicio o de tu incumplimiento de estos Términos, en la medida que la ley lo permita.",
      ],
    },
    {
      t: "25. Suspensión y terminación",
      b: [
        "Puedes dejar de usar el servicio y eliminar tu cuenta cuando quieras (la cancelación de la suscripción se rige por la sección 14). Podemos suspender o terminar tu acceso ante incumplimientos graves o reiterados de estos Términos, dándote aviso cuando sea posible y explicándote el motivo. Las cláusulas que por su naturaleza deban subsistir (propiedad intelectual, limitación de responsabilidad, indemnización, ley aplicable y obligaciones legales de conservación) permanecerán vigentes tras la terminación.",
      ],
    },
    {
      t: "26. Cambios a estos Términos",
      b: [
        "Podemos actualizar estos Términos. Cuando haya cambios materiales, publicaremos la nueva versión aquí (con su fecha) y te avisaremos por un medio razonable. Los cambios rigen hacia el futuro; si no estás de acuerdo, puedes cancelar antes de que entren en vigor.",
      ],
    },
    {
      t: "27. Fuerza mayor",
      b: [
        "No seremos responsables por incumplimientos o demoras causados por hechos fuera de nuestro control razonable (catástrofes, cortes de energía o de internet, fallas de proveedores, actos de autoridad, entre otros).",
      ],
    },
    {
      t: "28. Disposiciones generales",
      b: [
        "Si alguna cláusula se declara inválida, las demás seguirán vigentes (divisibilidad). El hecho de no ejercer un derecho no implica renuncia a él. No puedes ceder tu cuenta sin nuestro consentimiento; nosotros podemos ceder este contrato en el marco de una reorganización empresarial, respetando tus derechos y las obligaciones que la Ley 21.719 impone al responsable. Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo íntegro entre las partes.",
      ],
    },
    {
      t: "29. Ley aplicable y resolución de disputas",
      b: [
        "Estos Términos se rigen por las leyes de la República de Chile. Como consumidor, conservas el derecho a recurrir al Juzgado de Policía Local de tu domicilio y a presentar reclamos ante el SERNAC; en materia de datos personales, ante la Agencia de Protección de Datos Personales. Cualquier referencia a tribunales o legislación no afectará los derechos irrenunciables que te reconocen la Ley 19.496 y la Ley 21.719. Cualquier sometimiento a arbitraje solo podrá acordarse una vez surgido el conflicto y será gratuito para ti, conservando siempre tu derecho a acudir al tribunal competente.",
      ],
    },
    {
      t: "30. Contacto y notificaciones",
      b: [
        `Consultas: ${E.contacto}`,
        `Privacidad / Protección de Datos: ${E.dpo}`,
        `${E.razonSocial}, RUT ${E.rut} · ${E.domicilio}`,
      ],
    },
  ],
};

/* ---------------------------------------------------------------- Privacidad */

export const PRIVACIDAD: Documento = {
  titulo: "Política de Privacidad",
  intro: `Esta Política explica de forma clara qué datos personales tratamos, para qué los usamos, con qué base de licitud, con quién los compartimos, a qué países viajan, por cuánto tiempo los conservamos y qué derechos tienes sobre ellos. Se refiere al servicio Astros x Chat, accesible en ${E.sitio} y por WhatsApp. El servicio opera desde Chile y está escrito conforme a la Ley N° 21.719 sobre Protección de Datos Personales, plenamente exigible desde el 1 de diciembre de 2026: aplicamos su estándar desde ya, sin esperar esa fecha. Forma parte de nuestros Términos y Condiciones.`,
  secciones: [
    {
      t: "1. Quién es responsable de tus datos",
      b: [
        `El responsable del tratamiento es ${E.razonSocial}, RUT ${E.rut}, sociedad constituida en Chile, operadora del servicio Astros x Chat.`,
        {
          ul: [
            `Domicilio: ${E.domicilio}`,
            `Contacto de privacidad: ${E.dpo}`,
            `Contacto general: ${E.contacto}`,
          ],
        },
        "Mantenemos un registro interno de nuestras actividades de tratamiento y de las medidas de seguridad aplicadas, y podemos exhibirlo ante la Agencia de Protección de Datos Personales cuando lo requiera.",
      ],
    },
    {
      t: "2. A quién y a qué aplica",
      b: [
        "Esta política aplica a todas las personas que se registran o usan Astros x Chat, tanto en el sitio web como en el chat de WhatsApp. No aplica a sitios o servicios de terceros enlazados, que se rigen por sus propias políticas.",
      ],
    },
    {
      t: "3. Principios que aplicamos",
      b: [
        "Tratamos tus datos conforme a los principios de la Ley 21.719: licitud y lealtad, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia e información, y confidencialidad. En concreto, eso significa que solo pedimos lo que el servicio necesita, que te decimos para qué lo usamos antes de pedírtelo, que no lo reutilizamos para fines distintos sin volver a preguntarte, y que quienes trabajan con estos datos están sujetos a deber de secreto que subsiste incluso después de terminado el vínculo.",
      ],
    },
    {
      t: "4. Transparencia sobre la inteligencia artificial",
      b: [
        "Las respuestas de los oráculos son generadas por inteligencia artificial (un modelo de lenguaje de terceros; a la fecha de esta versión, un modelo abierto ejecutado en la infraestructura de Fireworks AI, en Estados Unidos — el detalle vigente está en la sección 8). No conversas con una persona real ni con un astrólogo profesional. El servicio es de entretenimiento, reflexión y autoconocimiento, y no sustituye orientación médica, psicológica, psiquiátrica, legal ni financiera. Si atraviesas una crisis o emergencia, acude a un profesional o llama a los servicios de urgencia (Emergencias: 131 · Salud Responde: 600 360 7777 · prevención del suicidio: *4141; más detalle en los Términos, sección 6).",
      ],
    },
    {
      t: "5. Qué datos tratamos",
      b: [
        "Tratamos únicamente los datos necesarios para prestarte el servicio:",
        {
          ul: [
            "Datos de cuenta: nombre, correo electrónico y contraseña (almacenada como hash, nunca en texto plano).",
            "Identificador del canal: tu número de WhatsApp en formato internacional, que es el identificador con el que WhatsApp nos entrega tu conversación.",
            "Datos de nacimiento: ciudad, fecha y, si la conoces y decides entregarla, hora de nacimiento. La hora es opcional: sin ella no calculamos tu ascendente.",
            "Datos astrológicos derivados: tu signo solar, tu signo lunar y tu ascendente, calculados a partir de lo anterior.",
            "Contenido de tus conversaciones: los mensajes que escribes y las respuestas que genera el oráculo.",
            "Datos de suscripción: estado (pendiente, activa, por terminar, cancelada), fechas de cambio de estado, identificador de la suscripción en la pasarela de pago y, si la cancelas, el motivo y comentario que entregues en el formulario de baja. No almacenamos el número de tu tarjeta ni su código de seguridad (ver sección 11).",
            "Uso del servicio: la cuenta de consultas que llevas en el día, para aplicar el límite diario.",
            "Recuperación de contraseña: si pides recuperar tu clave, guardamos por una hora una huella criptográfica del enlace que te enviamos, asociada a tu correo. El enlace en sí no se guarda.",
            "Datos técnicos y de seguridad: registros de acceso y de auditoría generados por nuestros proveedores de infraestructura.",
          ],
        },
        "No pedimos ni necesitamos tu RUT, tu dirección ni tu situación económica. Si los escribes dentro de una conversación, quedan en el contenido de esa conversación y se tratan como el resto del contenido.",
      ],
    },
    {
      t: "6. Datos personales sensibles y consentimiento",
      b: [
        "El contenido de tus conversaciones puede revelar tus creencias filosóficas o convicciones, y eventualmente información sobre tu salud, tus relaciones o tu vida íntima si decides compartirla. Son datos personales sensibles conforme a la Ley 21.719 y reciben un nivel de protección reforzado: se tratan solo con tu consentimiento expreso, para las finalidades declaradas aquí, y nunca se usan para elaborar perfiles con fines comerciales.",
        "El consentimiento lo otorgas mediante un acto afirmativo inequívoco: antes de la primera conversación, el chat te explica que las conversaciones se guardan y se procesan con un modelo de IA, incluida su transferencia a servidores fuera de Chile, y solo comienza cuando tocas el botón «Acepto» que acompaña esa explicación, o escribes «acepto». Un «ok», un «sí» o un emoji no cuentan como consentimiento. Registramos la fecha y la versión de ese consentimiento, de modo que podemos acreditar cuándo y a qué texto consentiste. Puedes retirarlo en cualquier momento escribiendo a " +
          E.dpo +
          " o eliminando tu cuenta desde «Mi cuenta»; el retiro es tan simple como el otorgamiento, no afecta la licitud del tratamiento previo e implica el cese del servicio.",
        "Te recomendamos no compartir en el chat información sensible que no desees procesar mediante un sistema de inteligencia artificial ubicado fuera de Chile.",
      ],
    },
    {
      t: "7. Para qué usamos tus datos y con qué base de licitud",
      b: [
        {
          tabla: {
            head: ["Finalidad", "Base de licitud"],
            rows: [
              ["Crear y administrar tu cuenta y autenticarte", "Ejecución del contrato"],
              [
                "Enviarte los correos necesarios para tu cuenta, como el enlace para recuperar tu contraseña cuando lo pides",
                "Ejecución del contrato",
              ],
              [
                "Calcular tu carta a partir de tus datos de nacimiento",
                "Ejecución del contrato y tu consentimiento",
              ],
              [
                "Generar las respuestas del oráculo y mantener la continuidad de la conversación (incluye contenido sensible)",
                "Tu consentimiento expreso",
              ],
              [
                "Cobrar la suscripción y cumplir obligaciones contables y tributarias",
                "Ejecución del contrato y cumplimiento de un deber legal",
              ],
              [
                "Aplicar el límite diario de consultas y prevenir abusos del servicio",
                "Ejecución del contrato e interés legítimo",
              ],
              [
                "Medir altas y bajas de suscripción de forma agregada (los registros se seudonimizan al eliminar tu cuenta)",
                "Interés legítimo",
              ],
              [
                "Seguridad, prevención de fraude y registros de auditoría",
                "Interés legítimo y deber legal de seguridad",
              ],
            ],
          },
        },
        "No usamos tus datos para publicidad, no los vendemos, no los cedemos a terceros con fines comerciales y no elaboramos perfiles comerciales con ellos.",
      ],
    },
    {
      t: "8. Procesamiento mediante inteligencia artificial",
      b: [
        "Para redactar cada respuesta, el contenido de la conversación sale de nuestros servidores y se procesa mediante un servicio de inteligencia artificial ubicado fuera de Chile. Aplicamos minimización de datos: en cada intercambio se envía únicamente el texto de tus mensajes y las respuestas del oráculo (hasta los últimos 20 mensajes de la conversación en curso), la personalidad del oráculo, tus datos astrológicos derivados —los nombres de tu signo solar, tu signo lunar y tu ascendente— y el estado del cielo del día, que es igual para todo el mundo.",
        "No se envían junto con el contenido tu nombre, tu correo electrónico, tu número de WhatsApp, el identificador de tu chat, ni tu ciudad, fecha u hora exactas de nacimiento: esos datos se quedan en nuestra base de datos y solo viaja el signo ya calculado. El contenido, en cambio, sí puede incluir cualquier dato personal que tú mismo hayas escrito en la conversación.",
        "A la fecha de esta versión, el modelo se ejecuta en la infraestructura de Fireworks AI, Inc. (Estados Unidos), a la que enviamos ese contenido a través de su API. Nosotros no entrenamos ningún modelo con tus conversaciones, no las vendemos, no las usamos para publicidad y nuestro equipo no las lee, salvo que tú pidas ayuda con un problema, que sea imprescindible para investigar un abuso o que la ley nos obligue. Lo que no podemos garantizarte es qué hace el proveedor con el contenido una vez recibido: se rige por sus propios términos y política de privacidad, que pueden permitirle conservarlo temporalmente para operar el servicio, facturar, detectar abusos o cumplir la ley.",
        "Por eso este tratamiento se realiza únicamente con tu consentimiento expreso (sección 6) y puedes retirarlo en cualquier momento. Si cambiamos de proveedor de inteligencia artificial, incorporamos uno nuevo o cambia el país donde se procesa tu contenido, publicaremos una nueva versión de esta Política con su fecha y te lo notificaremos por un medio razonable antes de que el cambio te afecte.",
      ],
    },
    {
      t: "9. Decisiones automatizadas",
      b: [
        "El oráculo genera texto de forma automatizada, pero eso no es una decisión con efectos jurídicos ni significativos sobre ti: es contenido de entretenimiento y reflexión que tú evalúas libremente. No usamos tus conversaciones para perfilarte, ni para decidir sobre tu acceso a crédito, empleo, seguros, prestaciones ni ningún otro asunto de esa naturaleza.",
        "Las decisiones que sí tomamos sobre tu cuenta —suspenderla por un uso prohibido, o registrar el rechazo de un pago— se adoptan con revisión humana, se te comunican con su fundamento y puedes pedir su reconsideración escribiendo a " +
          E.dpo +
          ". Conforme a la Ley 21.719 tienes derecho a oponerte a ser objeto de decisiones basadas únicamente en tratamiento automatizado que te afecten significativamente, y a solicitar la intervención de una persona.",
      ],
    },
    {
      t: "10. Con quién compartimos tus datos",
      b: [
        "Trabajamos con proveedores que tratan datos por nuestra cuenta y bajo nuestras instrucciones (encargados de tratamiento, con contrato y deber de confidencialidad), y con otros que, respecto de sus propias finalidades, actúan como responsables independientes. Cada uno recibe solo los datos necesarios para su función. A la fecha de esta versión son los siguientes:",
        {
          tabla: {
            head: ["Proveedor", "Rol y para qué", "Datos"],
            rows: [
              [
                "Fireworks AI, Inc.",
                "Encargado. Ejecutar el modelo de lenguaje que redacta las respuestas del oráculo",
                "Texto de tus mensajes y de las respuestas (hasta los últimos 20), tus signos solar y lunar y tu ascendente. Sin nombre, correo, teléfono, identificador de chat ni datos de nacimiento",
              ],
              [
                "Convex, Inc.",
                "Encargado. Base de datos y backend: almacenar tu cuenta, tus datos de nacimiento, tu suscripción y tus conversaciones",
                "Todos los datos de la sección 5",
              ],
              [
                "Meta Platforms (WhatsApp Business Platform)",
                "Canal oficial. Responsable independiente respecto de sus propias finalidades",
                "Tu número de WhatsApp; mensajes en tránsito",
              ],
              [
                "Vercel Inc.",
                `Encargado. Alojar ${E.sitio} y los formularios de registro, inicio de sesión y pago`,
                "Datos en tránsito durante tu navegación y los que escribes en los formularios",
              ],
              [
                "Brevo",
                "Encargado. Enviar los correos de tu cuenta, como el enlace para recuperar tu contraseña",
                "Tu correo electrónico y el contenido de ese correo. Nunca el contenido de tus conversaciones ni tus datos de nacimiento",
              ],
              [
                "Reveniu y Transbank",
                "Responsables independientes respecto de los datos de tu medio de pago. Procesar el cobro de la suscripción (ver sección 11)",
                "Correo electrónico, monto, y los datos de tu tarjeta, que ellos capturan directamente",
              ],
            ],
          },
        },
        "También podremos comunicar datos cuando la ley lo exija (requerimiento de autoridad competente) o para proteger derechos, la seguridad y el cumplimiento de nuestros términos. Si quieres saber a qué proveedores se ha comunicado tu contenido, escríbenos y te entregaremos el detalle que conste en nuestros registros.",
      ],
    },
    {
      t: "11. Transferencias internacionales",
      b: [
        "Nuestros proveedores de infraestructura, mensajería e inteligencia artificial procesan datos fuera de Chile. La Ley 21.719 permite estas transferencias cuando el país de destino ha sido declarado con nivel adecuado de protección, cuando existen cláusulas contractuales tipo o normas corporativas vinculantes aprobadas por la Agencia, o con el consentimiento expreso del titular informado sobre la falta de garantías.",
        "Al día de hoy la Agencia no ha declarado la adecuación de ningún país ni ha aprobado cláusulas tipo. Por eso estas transferencias se realizan sobre la base de tu consentimiento expreso (sección 6) y de los contratos de servicio que tenemos con cada proveedor, que por sí solos no constituyen una garantía adecuada en el sentido de la ley. Te lo decimos con esa precisión para que decidas informadamente, y asumimos el compromiso de adoptar las cláusulas tipo apenas la Agencia las publique, actualizando esta Política.",
        {
          tabla: {
            head: ["Proveedor", "País(es)", "Base o condición de la transferencia"],
            rows: [
              [
                "Fireworks AI, Inc.",
                "Estados Unidos",
                "Contrato de servicio con el proveedor, que por sí solo no constituye una garantía adecuada, y tu consentimiento expreso. Recibe contenido seudonimizado: sin tu nombre, correo, teléfono ni identificador de chat",
              ],
              [
                "Convex, Inc.",
                "Estados Unidos",
                "Contrato de servicio con el proveedor y tu consentimiento expreso. Los datos se almacenan cifrados en reposo por el proveedor",
              ],
              [
                "Meta Platforms (WhatsApp)",
                "Estados Unidos y otros países de su infraestructura global",
                "Es el canal que tú eliges usar, y tu consentimiento expreso. Respecto de sus propias finalidades actúa como responsable independiente, de modo que puedes ejercer tus derechos directamente ante él",
              ],
              [
                "Vercel Inc.",
                "Estados Unidos, sobre una red de distribución global",
                "Contrato de servicio con el proveedor y tu consentimiento expreso",
              ],
              [
                "Brevo",
                "Unión Europea (proveedor con sede en Francia)",
                "Contrato de servicio con el proveedor. Solo recibe tu correo cuando tú pides un correo de tu cuenta, como recuperar tu contraseña, y la transferencia es necesaria para entregártelo. El proveedor está sujeto al Reglamento General de Protección de Datos europeo, lo que no equivale a una declaración de adecuación de la Agencia",
              ],
              [
                "Reveniu · Transbank",
                "Chile",
                "El cobro se procesa en Chile; no hay transferencia internacional en el pago",
              ],
            ],
          },
        },
        "Puedes solicitar más información sobre estas transferencias, o retirar tu consentimiento, escribiendo a " +
          E.dpo +
          ". Ten presente que sin ellas el servicio no puede funcionar, de modo que retirar el consentimiento implica el cese del servicio.",
      ],
    },
    {
      t: "12. Pagos",
      b: [
        "El cobro de la suscripción lo procesa Reveniu, pasarela de pago chilena, sobre la plataforma de Transbank (inscripción de tarjeta en modalidad OneClick para el cobro recurrente). Ellos capturan y tratan los datos de tu tarjeta bajo los estándares de seguridad de pagos (PCI-DSS) y, respecto de esos datos, actúan conforme a sus propias políticas. Nosotros no almacenamos ni accedemos al número completo de tu tarjeta ni a su código de seguridad: de nuestro lado guardamos el estado de tu suscripción y el identificador de la transacción. Puedes cancelar tu suscripción desde «Mi cuenta» en el sitio.",
      ],
    },
    {
      t: "13. Por cuánto tiempo conservamos tus datos",
      b: [
        {
          tabla: {
            head: ["Dato", "Plazo de conservación"],
            rows: [
              [
                "Cuenta, datos de nacimiento, carta y conversaciones",
                "Mientras tu cuenta esté activa. Al eliminarla desde «Mi cuenta», se borran tu cuenta, tu conversación, tus datos de nacimiento y tu registro de consentimiento",
              ],
              [
                "Historial de una lectura",
                "Hasta que escribas «/nueva» en el chat, que lo borra de inmediato y empieza una lectura desde cero",
              ],
              [
                "Enlace de recuperación de contraseña",
                "Deja de servir a la hora, al usarlo o al pedir uno nuevo. El registro vencido se elimina en la siguiente limpieza automática, y también al eliminar tu cuenta",
              ],
              [
                "Registros de altas y bajas de suscripción",
                "Se conservan de forma seudonimizada para medir el servicio de manera agregada: al eliminar tu cuenta, tu correo se reemplaza por un código sin vínculo contigo",
              ],
              [
                "Datos de facturación y pago",
                "Hasta 6 años, conforme a la legislación tributaria chilena (incluso después de eliminar tu cuenta)",
              ],
              [
                "Registros técnicos y de seguridad de nuestros proveedores",
                "Según los plazos de retención de cada proveedor de infraestructura, salvo que un plazo legal exija conservarlos por más tiempo",
              ],
            ],
          },
        },
        "Cumplido el plazo, los datos se eliminan o se anonimizan de forma irreversible.",
      ],
    },
    {
      t: "14. Cómo protegemos tus datos",
      b: [
        "Aplicamos cifrado en tránsito (TLS) en todas las comunicaciones, y tus datos se almacenan cifrados en reposo por nuestro proveedor de base de datos. Las contraseñas se guardan como hash con derivación de clave (PBKDF2), nunca en texto plano. Los enlaces para recuperar una contraseña sirven una sola vez, vencen en una hora y se guardan solo como huella criptográfica, de modo que una copia de nuestra base de datos no permite usarlos. Los webhooks de los canales y de la pasarela de pago se validan criptográficamente antes de aceptarlos. El acceso administrativo está restringido a una lista cerrada de cuentas y los endpoints internos exigen credenciales propias. El panel de administración muestra cuentas y estado de suscripción, pero no da acceso al contenido de las conversaciones. Cada conversación queda aislada por su identificador de canal.",
        "Quienes intervienen en el tratamiento están sujetos a deber de secreto, que se mantiene después de terminado el vínculo. Ningún sistema es 100% infalible, pero adoptamos medidas técnicas y organizativas razonables y proporcionales al riesgo, y las revisamos cuando cambia el servicio.",
      ],
    },
    {
      t: "15. Tus derechos",
      b: [
        "Conforme a la Ley 21.719, tienes derecho a:",
        {
          ul: [
            "Acceso: saber qué datos tenemos sobre ti, de dónde salieron, para qué los usamos, a quién se han comunicado y por cuánto tiempo los conservaremos, y obtener una copia.",
            "Rectificación: corregir datos inexactos, desactualizados o incompletos (por ejemplo, una fecha de nacimiento mal ingresada).",
            "Supresión o cancelación: que eliminemos tus datos, salvo aquellos que debamos conservar por ley. Puedes ejercerlo tú mismo, en cualquier momento, desde «Mi cuenta» → eliminar cuenta.",
            "Oposición: oponerte a un tratamiento determinado y retirar tu consentimiento en cualquier momento.",
            "Portabilidad: recibir tus datos en un formato estructurado, genérico y de uso común, o que se transfieran a otro responsable cuando sea técnicamente posible.",
            "Bloqueo: suspender temporalmente el tratamiento de tus datos mientras se resuelve una solicitud o un reclamo.",
            "No ser objeto de decisiones automatizadas con efectos jurídicos o significativos, y pedir intervención humana (ver sección 9).",
          ],
        },
        "Para ejercer cualquiera de estos derechos, escribe a " +
          E.dpo +
          ". Verificaremos tu identidad —solo para asegurarnos de que eres tú— y responderemos dentro del plazo legal; nuestro compromiso interno es hacerlo en menos de 15 días hábiles. El ejercicio de estos derechos es gratuito y son irrenunciables: ninguna cláusula de esta Política ni de nuestros Términos los limita o excluye.",
        "Si no estás conforme con nuestra respuesta, o si no respondemos, puedes reclamar ante la Agencia de Protección de Datos Personales.",
      ],
    },
    {
      t: "16. Menores de edad",
      b: [
        "Astros x Chat está dirigido exclusivamente a personas mayores de 18 años. No recopilamos intencionadamente datos de menores ni tratamos datos de niñas, niños o adolescentes. Si detectamos que una cuenta pertenece a un menor, la eliminaremos.",
      ],
    },
    {
      t: "17. Notificación de brechas de seguridad",
      b: [
        "Llevamos un registro de los incidentes de seguridad que afecten datos personales. Si ocurriera una vulneración que suponga un riesgo para tus derechos, la notificaremos a la Agencia de Protección de Datos Personales sin dilación indebida y por el medio más expedito, y te lo comunicaremos también a ti —en especial tratándose de datos sensibles, como es el contenido de tus conversaciones—, explicándote qué pasó, qué datos se vieron afectados y qué puedes hacer.",
      ],
    },
    {
      t: "18. Cambios a esta política",
      b: [
        "Podemos actualizar esta Política. Cuando haya cambios materiales —un proveedor nuevo, un país de procesamiento distinto, una finalidad adicional— publicaremos la nueva versión aquí con su fecha, te avisaremos por un medio razonable antes de que el cambio te afecte y, cuando corresponda, te pediremos nuevamente tu consentimiento.",
      ],
    },
    {
      t: "19. Contacto y autoridad de control",
      b: [
        `Privacidad: ${E.dpo}`,
        `Contacto general: ${E.contacto}`,
        `${E.razonSocial}, RUT ${E.rut} · ${E.domicilio}`,
        "Autoridad de control: Agencia de Protección de Datos Personales de Chile.",
      ],
    },
  ],
};

/* --------------------------------------------------------------- Reembolsos */

// Desarrolla la sección 15 de los Términos. Existe como página aparte porque el footer la
// enlaza directo: es lo primero que busca quien quiere su plata de vuelta.
export const REEMBOLSOS: Documento = {
  titulo: "Política de Reembolso",
  intro: `Esta Política detalla cuándo procede un reembolso, cómo pedirlo y en qué plazo lo resolvemos. Complementa la sección 15 de nuestros Términos y Condiciones y no limita en nada los derechos que la Ley 19.496 sobre Protección de los Derechos de los Consumidores te reconoce como consumidor, que son irrenunciables. Aplica a las suscripciones de Astros x Chat contratadas en ${E.sitio}.`,
  secciones: [
    {
      t: "1. Derecho a retracto: 10 días",
      b: [
        "Como se trata de una contratación a distancia, tienes derecho a retractarte dentro de los 10 días siguientes a la contratación, conforme al artículo 3 bis de la Ley 19.496, sin expresar causa y sin costo para ti.",
        "Astros x Chat es un servicio digital de consumo inmediato: el reembolso por retracto cubre las sumas que no correspondan a servicios ya prestados a la fecha en que ejerces el retracto. Si no alcanzaste a conversar con el oráculo, la devolución es íntegra.",
      ],
    },
    {
      t: "2. Cancelación de la suscripción",
      b: [
        "Cancelar no es lo mismo que pedir un reembolso. Al cancelar, detienes la renovación y conservas el acceso hasta el final del período que ya pagaste; por ese período en curso no corresponde devolución proporcional, porque el servicio sigue disponible para ti hasta que termine.",
        "Puedes cancelar en cualquier momento desde «Mi cuenta» en el sitio, con un clic, o escribiéndonos a " +
          E.contacto +
          ". Una suscripción dada de baja no se puede reactivar: para volver, se contrata una nueva.",
      ],
    },
    {
      t: "3. Casos en que devolvemos el 100%",
      b: [
        "Sin discusión y sin que tengas que insistir, devolvemos el total cobrado cuando:",
        {
          ul: [
            "se te cobró dos veces el mismo período;",
            "se te cobró después de haber cancelado;",
            "nunca pudiste acceder al chat por un problema atribuible a nosotros;",
            "el cobro no fue autorizado por ti (sin perjuicio de que también puedes desconocerlo ante tu banco).",
          ],
        },
      ],
    },
    {
      t: "4. Fallas del servicio",
      b: [
        "Si el servicio estuvo caído o inutilizable por un período relevante y por causa atribuible a nosotros, puedes elegir entre una extensión equivalente de tu suscripción o el reembolso proporcional de los días afectados. No cuentan como falla las interrupciones breves de mantenimiento ni las caídas del canal de mensajería o de tu conexión.",
      ],
    },
    {
      t: "5. Qué no se reembolsa",
      b: [
        "Fuera del plazo de retracto y de los casos anteriores, no se reembolsan los períodos ya transcurridos ni las consultas ya utilizadas, ni procede devolución por insatisfacción con el contenido de las lecturas, que es de naturaleza simbólica y de entretenimiento (ver la sección 5 de los Términos). Tampoco procede reembolso cuando la cuenta fue suspendida o cerrada por un uso prohibido conforme a la sección 16 de los Términos.",
      ],
    },
    {
      t: "6. Cómo solicitarlo",
      b: [
        "Escríbenos a " +
          E.contacto +
          " indicando el correo con el que te registraste y la fecha del cobro. No necesitas llenar formularios ni llamar por teléfono.",
        "Acusamos recibo de tu solicitud y la resolvemos dentro de los 10 días hábiles siguientes, comunicándote la decisión y su fundamento por escrito.",
      ],
    },
    {
      t: "7. Cómo se paga el reembolso",
      b: [
        "El reembolso, cuando procede, se ejecuta al mismo medio de pago con que se hizo el cobro, a través de nuestra pasarela Reveniu y de Transbank. Una vez emitido de nuestro lado, el plazo en que verás el abono depende del emisor de tu tarjeta. No emitimos devoluciones en efectivo, a cuentas de terceros ni como crédito interno, salvo que tú lo prefieras expresamente.",
      ],
    },
    {
      t: "8. Si no estás conforme",
      b: [
        "Si nuestra respuesta no te satisface, puedes reclamar ante el SERNAC o recurrir al Juzgado de Policía Local de tu domicilio. Nada en esta Política limita esos derechos.",
        `Consultas sobre cobros y reembolsos: ${E.contacto} · ${E.razonSocial}, RUT ${E.rut}`,
      ],
    },
  ],
};

/* ------------------------------------------------------------------ Renderer */

export function LegalDoc({ doc }: { doc: Documento }) {
  return (
    <main className="pt-32 pb-24 px-6 max-w-3xl mx-auto text-on-surface">
      <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter mb-3">{doc.titulo}</h1>
      <p className="text-sm text-on-surface-variant mb-10">Versión {VERSION}</p>
      <p className="text-on-surface-variant leading-relaxed mb-12">{doc.intro}</p>

      {doc.secciones.map((s) => (
        <section key={s.t} className="mb-10">
          <h2 className="text-xl font-headline font-bold mb-4">{s.t}</h2>
          {s.b.map((b, i) =>
            typeof b === "string" ? (
              <p key={i} className="text-on-surface-variant leading-relaxed mb-4">
                {b}
              </p>
            ) : "ul" in b ? (
              <ul key={i} className="list-disc pl-6 space-y-2 mb-4 text-on-surface-variant">
                {b.ul.map((li) => (
                  <li key={li}>{li}</li>
                ))}
              </ul>
            ) : (
              <div key={i} className="overflow-x-auto mb-4">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/30">
                      {b.tabla.head.map((h) => (
                        <th key={h} className="py-2 pr-4 font-bold align-top">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-on-surface-variant">
                    {b.tabla.rows.map((row) => (
                      <tr key={row[0]} className="border-b border-primary/10 align-top">
                        {row.map((cell, j) => (
                          <td key={j} className="py-3 pr-4">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          )}
        </section>
      ))}
    </main>
  );
}
