/** miniatura.test.js — URL de la miniatura de una foto de insumo. */
import { describe, test, expect } from "vitest";
import { miniatura, fotoMini } from "../src/utils/miniatura.js";

describe("miniatura", () => {
  test("foto de insumo → min/<nombre>.webp", () => {
    expect(miniatura("/storage/Insumos/insumo_1_abc.jpg")).toBe("/storage/Insumos/min/insumo_1_abc.webp");
    expect(miniatura("http://x:5173/storage/Insumos/a.png")).toBe("http://x:5173/storage/Insumos/min/a.webp");
  });
  test("otras imágenes o vacío no cambian", () => {
    expect(miniatura("/assets/img/logo.png")).toBe("/assets/img/logo.png");
    expect(miniatura(null)).toBe(null);
  });
  test("si la miniatura falla, la imagen cae a la foto completa una sola vez", () => {
    const p = fotoMini("/storage/Insumos/a.jpg");
    const img = { dataset: {}, src: p.src };
    p.onError({ currentTarget: img });
    expect(img.src).toBe("/storage/Insumos/a.jpg");
    img.src = "otra"; p.onError({ currentTarget: img });
    expect(img.src).toBe("otra");
    expect(p.loading).toBe("lazy");
  });
});
