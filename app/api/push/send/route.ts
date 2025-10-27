import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
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