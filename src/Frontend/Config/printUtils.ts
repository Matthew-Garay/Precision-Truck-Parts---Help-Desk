/** printUtils.ts — Lógica de impresión compartida por todas las páginas PDF */

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

export async function triggerPrint(): Promise<void> {
  await new Promise(r => setTimeout(r, 400));
  await waitForImages();
  await new Promise(r => setTimeout(r, 150));
  window.print();
}
