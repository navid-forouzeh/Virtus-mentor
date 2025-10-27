export const runtime = "nodejs";

export async function GET() {
  try {
    const { generateKeyPairSync } = await import("crypto");

    // ECC-Schlüsselpaar erzeugen (P-256)
    const { publicKey, privateKey } = generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });

    // Public Key in unkomprimiertes Format exportieren
    const pubRaw = publicKey.export({ type: "spki", format: "der" });
    const privJwk = privateKey.export({ format: "jwk" }) as any;

    const publicKeyBase64 = Buffer.from(pubRaw)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const privateKeyBase64 = privJwk.d;

    return new Response(
      JSON.stringify({
        ok: true,
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || "Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}