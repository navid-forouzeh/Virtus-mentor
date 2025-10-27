export const runtime = "nodejs";

import webpush from "web-push";

export async function GET() {
  try {
    const vapidKeys = webpush.generateVAPIDKeys();

    return new Response(
      JSON.stringify({
        ok: true,
        message: "✅ Hier sind deine neuen VAPID Keys",
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Fehler beim Generieren der Keys",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}