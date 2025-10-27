export const runtime = "nodejs";
import webpush from "web-push";

export async function GET() {
  const pub = process.env.VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";
  let vapidOk = false;
  try {
    if (pub && priv) {
      webpush.setVapidDetails("mailto:admin@example.com", pub, priv);
      vapidOk = true;
    }
  } catch { vapidOk = false; }
  return Response.json({ ok: true, env: { pub: !!pub, priv: !!priv, vapidOk } });
}