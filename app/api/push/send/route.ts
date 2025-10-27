export const runtime = "nodejs";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sub = body.subscription;
    const payload = JSON.stringify({
      title: body.title || "Virtus Mentor",
      body: body.body || "",
      url: body.url || "/",
    });
    await webpush.sendNotification(sub, payload);
    return new Response("ok");
  } catch (e: any) {
    return new Response(e?.message || "push failed", { status: 500 });
  }
}