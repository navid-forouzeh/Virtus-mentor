// KORREKTE VAPID-Keys (raw P-256) erzeugen
export const runtime = "nodejs";
import { webcrypto } from "node:crypto";
const subtle = webcrypto.subtle;

const b64url = (buf: ArrayBuffer) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

export async function GET() {
  try {
    // EC P-256 Schlüsselpaar
    const kp = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);

    // PUBLIC: unkomprimierter Punkt ("raw") = 65 Bytes → Base64URL, beginnt typ. mit "B"
    const pubRaw = await subtle.exportKey("raw", kp.publicKey);
    const publicKey = b64url(pubRaw);

    // PRIVATE: JWK.d ist bereits Base64URL (32 Bytes)
    const jwkPriv = (await subtle.exportKey("jwk", kp.privateKey)) as any;
    const privateKey = jwkPriv.d;

    return new Response(JSON.stringify({ ok: true, publicKey, privateKey }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify