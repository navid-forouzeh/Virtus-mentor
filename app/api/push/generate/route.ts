// erzeugt VAPID-Keys mit Node WebCrypto – kein web-push nötig
export const runtime = "nodejs";
import { webcrypto } from "node:crypto";
const subtle = webcrypto.subtle;

function b64url(buf: ArrayBuffer) {
  const b = Buffer.from(buf);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function GET() {
  try {
    // P-256 Keypair (ECDSA) – Basis für VAPID
    const kp = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    // Public: unkomprimierter Punkt (65 Bytes) → Base64URL
    const pubRaw = await subtle.exportKey("raw", kp.publicKey);
    // Private: JWK.d ist bereits Base64URL (32 Bytes)
    const jwkPriv = (await subtle.exportKey("jwk", kp.privateKey)) as any;

    const publicKey = b64url(pubRaw);
    const privateKey = jwkPriv.d; // schon base64url

    return new Response(JSON.stringify({ ok: true, publicKey, privateKey }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}