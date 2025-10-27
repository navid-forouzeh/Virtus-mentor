"use client";
import { useEffect } from "react";

export default function EnablePushButton() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  async function enablePush() {
    if (!("Notification" in window)) return alert("Dein Browser unterstützt keine Notifications");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return alert("Benachrichtigungen blockiert");

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
    });

await fetch("/api/push/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subscription: sub,
    title: "Willkommen, Navid 👋",
    body: "Dein Mentor-Push ist bereit. Test folgt in Kürze."
  })
});

// iOS Fix – zeigt Erfolgsmeldung an
console.log("Subscription:", JSON.stringify(sub));
alert("✅ Push aktiviert! Deine Subscription wurde gespeichert (Konsole zeigt Details).");
  }

  return <button onClick={enablePush}>🔔 Push aktivieren</button>;
}

function toKey(v: string) {
  const p = "=".repeat((4 - (v.length % 4)) % 4);
  const s = (v + p).replace(/-/g, "+").replace(/_/g, "/");
  const r: string = atob(s);
  const arr = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) arr[i] = r.charCodeAt(i);
  return arr;
}
