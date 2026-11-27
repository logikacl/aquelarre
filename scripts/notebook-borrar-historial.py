# Mantención del chat de un cuaderno de NotebookLM (Gemini Notebook).
#
#   ~/.claude/skills/notebooklm/.venv/bin/python scripts/notebook-borrar-historial.py <url> [--confirmar] [--destrabar]
#
# Borrar el historial: el cuaderno guarda cada pregunta con su respuesta y vuelve a cargar todo
# al abrirse. Pasadas ~40 respuestas largas la página tarda más que los timeouts de la skill y
# TODAS las preguntas siguientes fallan. notebook-a-pasajes.mjs lo llama cada N preguntas; lo
# respondido ya está en la caché local. Sin --confirmar abre el diálogo y lo cancela (prueba).
#
# --destrabar (tras un fallo): a veces una respuesta queda colgada en "Reading your inputs…"
# y el chat no acepta nada más hasta que termina (puede tardar 20+ min). Detiene esa respuesta
# con el botón ■ y borra el historial. Si en cambio la página muestra el límite diario
# ("AI usage limit reached… after HH:MM"), sale con código 3 para que el script cambie de cuenta.
#
# La cuenta la elige NOTEBOOKLM_DATA_DIR (ver config.py de la skill). Cada cuenta ve la
# interfaz en su idioma: los textos se buscan en inglés y en español.
import re, sys, time
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/notebooklm/scripts"))
from patchright.sync_api import sync_playwright  # noqa: E402
from browser_utils import BrowserFactory  # noqa: E402

CONFIG = "button[aria-label='Notebook configuration'], button[aria-label='Configuración del cuaderno']"
BORRAR_HISTORIAL = re.compile(r"Delete chat history|Borrar el historial de chat")
CONFIRMAR = re.compile(r"^(Delete|Borrar|Eliminar)$")
CANCELAR = re.compile(r"^(Cancel|Cancelar)$")
LIMITE = re.compile(r"usage limit reached|límite de uso", re.I)

url = sys.argv[1]
confirmar = "--confirmar" in sys.argv or "--destrabar" in sys.argv
destrabar = "--destrabar" in sys.argv


def botones(page, patron, dentro=".cdk-overlay-container button"):
    # Los locators de Playwright no resolvían los botones del diálogo; los ElementHandle sí.
    return [b for b in page.query_selector_all(dentro)
            if b.is_visible() and patron.search(b.inner_text().strip())]


with sync_playwright() as p:
    ctx = BrowserFactory.launch_persistent_context(p, headless=True)
    try:
        page = ctx.new_page()
        page.set_viewport_size({"width": 1600, "height": 1000})
        page.goto(url, wait_until="domcontentloaded")
        boton = page.wait_for_selector(CONFIG, state="visible", timeout=60_000)
        time.sleep(5)

        if destrabar:
            aviso = LIMITE.search(page.inner_text("body"))
            if aviso:
                linea = next(l for l in page.inner_text("body").splitlines() if LIMITE.search(l))
                print(f"límite: {linea.strip()}")
                sys.exit(3)
            stop = botones(page, re.compile(r"^stop$"), "button")
            if stop:
                stop[-1].click(force=True)
                time.sleep(3)
                print("respuesta colgada detenida")

        boton.click(force=True)  # un tooltip suele tapar el botón e intercepta el click normal
        time.sleep(1)
        opciones = botones(page, BORRAR_HISTORIAL)
        if not opciones:
            print("no se abrió el menú; el historial queda como está")
            sys.exit(0)
        opcion = opciones[0]
        if not opcion.is_enabled() or opcion.get_attribute("aria-disabled") == "true":
            print("historial ya vacío")  # la opción viene deshabilitada si no hay chat
            sys.exit(0)
        opcion.click()
        time.sleep(2)
        objetivo = botones(page, CONFIRMAR if confirmar else CANCELAR)
        if not objetivo:
            sys.exit("no apareció el diálogo de confirmación")
        objetivo[-1].click()
        time.sleep(4 if confirmar else 1)
        print("historial borrado" if confirmar else "cancelado (prueba)")
    finally:
        ctx.close()
