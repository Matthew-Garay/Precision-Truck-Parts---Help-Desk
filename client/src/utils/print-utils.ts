/**
 * printUtils.ts
 *
 * Utilidades compartidas por todas las paginas de impresion PDF del sistema.
 * Estas paginas se abren en una ventana nueva y llaman a window.print()
 * automaticamente al cargar.
 *
 * Funciones exportadas:
 *
 *   waitForImages()
 *     Espera a que todas las imagenes del documento terminen de cargar antes
 *     de continuar. Esto evita que el dialogo de impresion se abra con imagenes
 *     en blanco porque aun no habian terminado de descargarse.
 *     Retorna una promesa que se resuelve cuando todas las imagenes estan listas
 *     o cuando pasan 4 segundos (timeout de seguridad).
 *
 *   triggerPrint()
 *     Orquesta la secuencia completa de impresion:
 *       1. Espera 400 ms para que React termine de renderizar el contenido.
 *       2. Llama a waitForImages() para esperar las imagenes.
 *       3. Espera 150 ms adicionales para que el navegador aplique los estilos CSS.
 *       4. Abre el dialogo de impresion del navegador con window.print().
 *     Retorna una promesa que se resuelve cuando el dialogo de impresion se abre.
 */

/**
 * Espera a que todas las imagenes del documento esten completamente cargadas.
 * Tiene un timeout de 4 segundos para no bloquear la impresion indefinidamente.
 *
 * @returns {Promise<void>}
 */
export function waitForImages(): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
    const pending = imgs.filter(img => !img.complete || img.naturalWidth === 0);
    if (pending.length === 0) { resolve(); return; }
    let remaining = pending.length;
    const done = () => { if (--remaining <= 0) resolve(); };
    pending.forEach(img => {
      img.addEventListener("load",  done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    setTimeout(resolve, 4000);
  });
}

/**
 * Ejecuta la secuencia completa de impresion: espera el render, las imagenes
 * y los estilos antes de abrir el dialogo del navegador.
 *
 * @returns {Promise<void>}
 */
export async function triggerPrint(): Promise<void> {
  await new Promise(r => setTimeout(r, 400));
  await waitForImages();
  await new Promise(r => setTimeout(r, 150));
  window.print();
}
