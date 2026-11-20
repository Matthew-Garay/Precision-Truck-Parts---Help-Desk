/** ajustar-ip.test.js — Usar la IP nueva de la PC si cambió (sin tocar el .env). */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ipNueva, ajustarIp, ipsLocales } from "../utils/ajustar-ip.js";

describe("IP de la PC", () => {
  test("si la IP del .env ya no está pero hay otra en la misma red, se usa la nueva", () => {
    assert.deepEqual(ipNueva("http://192.168.31.115:5173", ["26.68.49.36", "192.168.31.128"]), { anterior: "192.168.31.115", nueva: "192.168.31.128" });
  });
  test("no cambia si la IP sigue en la PC, si es localhost o si solo hay IP de otra red (VPN)", () => {
    assert.equal(ipNueva("http://192.168.31.128:5173", ["192.168.31.128"]), null);
    assert.equal(ipNueva("http://localhost:5173", ["192.168.31.128"]), null);
    assert.equal(ipNueva("http://192.168.31.115:5173", ["26.68.49.36", "10.0.0.5"]), null);
    assert.equal(ipNueva("http://192.168.31.115:5173", ["192.168.31.128", "192.168.31.129"]), null, "dos candidatas: no adivina");
  });
  test("reemplaza la IP en todas las direcciones del sistema, solo en memoria", () => {
    const env = {
      APP_URL: "http://192.168.31.115:5173", CORS_ORIGIN: "http://192.168.31.115:5173",
      ZOHO_REDIRECT_URIS: "http://192.168.31.115:3001/cb,http://192.168.31.115:5173/cb,http://localhost:3001/cb",
      OTRA: "http://192.168.31.115",
    };
    assert.deepEqual(ajustarIp(env, ["192.168.31.128"]), { anterior: "192.168.31.115", nueva: "192.168.31.128" });
    assert.equal(env.APP_URL, "http://192.168.31.128:5173");
    assert.equal(env.ZOHO_REDIRECT_URIS, "http://192.168.31.128:3001/cb,http://192.168.31.128:5173/cb,http://localhost:3001/cb");
    assert.equal(env.OTRA, "http://192.168.31.115", "solo las variables de direcciones del sistema");
  });
  test("lee las IPv4 de la PC sin la de loopback", () => {
    assert.deepEqual(ipsLocales({ lo: [{ family: "IPv4", internal: true, address: "127.0.0.1" }], wifi: [{ family: "IPv4", internal: false, address: "192.168.31.128" }, { family: "IPv6", internal: false, address: "fe80::1" }] }), ["192.168.31.128"]);
  });
});
