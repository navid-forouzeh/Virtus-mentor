// Erzwingt Node.js-Laufzeit (wichtig für web-push)
export const runtime = "nodejs";

import webpush from "web-push";

function ensureVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    throw new Error("VAPID keys missing. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Vercel.");
  }
  webpush.setVapidDetails("mailto:admin@example.com", pub, priv);
}

export async function POST(req: Request) {
  // ENV erst zur Laufzeit prüfen, nicht beim Build:
  ensureVapid();

  const { subscription, title, body, url } = await req.json();
  if (!subscription?.endpoint) return new Response("bad request", { status: 400 });

  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: title || "Guten Morgen, Navid 🌅",
      body: body || "Dein Mentor-Push ist aktiv.",
      data: { url: url || "/" },
    })
  );

  return Response.json({ ok: true });
}