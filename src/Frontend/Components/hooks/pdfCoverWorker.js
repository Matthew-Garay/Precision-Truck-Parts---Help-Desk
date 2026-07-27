// pdfjs v6 usa `window` internamente — en un Worker solo existe `self`
self.window = self;

import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).href;

self.onmessage = async ({ data: { id, url } }) => {
  try {
    const pdf  = await pdfjs.getDocument({ url, withCredentials: false }).promise;
    const page = await pdf.getPage(1);
    const vp0  = page.getViewport({ scale: 1 });
    const vp   = page.getViewport({ scale: 140 / vp0.width });
    const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    pdf.destroy();
    const blob   = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.70 });
    const buffer = await blob.arrayBuffer();
    self.postMessage({ id, buffer }, [buffer]);
  } catch (e) {
    self.postMessage({ id, buffer: null, error: e.message });
  }
};
