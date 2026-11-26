# Borra el historial de chat de un cuaderno de NotebookLM (Gemini Notebook).
#
#   ~/.claude/skills/notebooklm/.venv/bin/python scripts/notebook-borrar-historial.py <url> [--confirmar]
#
# Por qué: el cuaderno guarda cada pregunta con su respuesta y vuelve a cargar todo al abrirse.
# Pasadas ~40 respuestas largas la página tarda más que los timeouts de la skill y TODAS las
# preguntas siguientes fallan. notebook-a-pasajes.mjs lo llama cada N preguntas; las
# respuestas ya están en la caché local, así que no se pierde nada.
# Sin --confirmar abre el diálogo y lo cancela (para probar los selectores).
import sys, time
from pathlib import Path

sys.path.insert(0, str(Path.home() / ".claude/skills/notebooklm/scripts"))
from patchright.sync_api import sync_playwright  # noqa: E402
from browser_utils import BrowserFactory  # noqa: E402

url, confirmar = sys.argv[1], "--confirmar" in sys.argv
with sync_playwright() as p:
    ctx = BrowserFactory.launch_persistent_context(p, headless=True)
    try:
        page = ctx.new_page()
        page.set_viewport_size({"width": 1600, "height": 1000})
        page.goto(url, wait_until="domcontentloaded")
        boton = page.wait_for_selector("button[aria-label='Notebook configuration']", state="visible", timeout=60_000)
        time.sleep(3)
        boton.click(force=True)  # un tooltip suele tapar el botón e intercepta el click normal
        time.sleep(1)
        page.locator(".cdk-overlay-container button", has_text="Delete chat history").click()
        time.sleep(1.5)
        capa = page.locator(".cdk-overlay-container")
        capa.get_by_text("delete the full chat history").wait_for(timeout=15_000)  # el diálogo de confirmación
        if confirmar:
            # Los locators de Playwright no resolvían este botón; el ElementHandle sí.
            [b for b in page.query_selector_all("button") if b.is_visible() and b.inner_text().strip() == "Delete"][-1].click()
            time.sleep(4)
            print("historial borrado")
        else:
            capa.locator("button", has_text="Cancel").click()
            print("cancelado (prueba)")
    finally:
        ctx.close()
