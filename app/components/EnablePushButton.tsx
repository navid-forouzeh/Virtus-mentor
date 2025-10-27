"use client";
import { useEffect, useState } from "react";

export default function EnablePushButton() {
  const [log, setLog] = useState<string>("Bereit.");
  const add = (m: string) => setLog((x) => x + "\n" + m);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => add("SW: registriert"))
        .catch((e)=> add("SW-Fehler: " + (e?.message || e)));
    } else {
      add("Kein ServiceWorker Support.");
    }
  }, []);

  async function enablePush() {
    try {
      add("Starte Diagnose …");

      // 1) Server/ENV check
      const dbg = await fetch("/api/push/debug", { cache: "no-store" });
      const dbgJson = await dbg.json();
      if (!dbgJson.env?.pub || !dbgJson.env?.priv) {
        alert("❗️VAPID Keys fehlen auf dem Server. Bitte in Vercel setzen.");
        add("ENV fehlt auf Server.");
        return;
      }
      add("Server/ENV: OK");

      // 2) Permission
      if (!("Notification" in window)) { alert("Dieser Modus unterstützt keine Notifications."); return; }
      const perm = await Notification.requestPermission();
      add("Permission: " + perm);
      if (perm !== "granted") { alert("Benachrichtigungen blockiert."); return; }

      // 3) Subscribe
      const reg = await navigator.serviceWorker.ready;
      const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!pub) { alert("❗️NEXT_PUBLIC_VAPID_PUBLIC_KEY fehlt (Client)."); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toKey(pub)
      });
      add("Subscribed: OK");

      const subJson = JSON.stringify(sub);
      add("Subscription:\n" + subJson);

      // 4) Sofort-Push-Test
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          title: "Guten Morgen, Navid 🌅",
          body: "Mentor-Push aktiv. Kleine Schritte – großer Effekt.",
          url: "/"
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error("Serverantwort: " + t);
      }
      add("Server: Push gesendet ✅");
      alert("✅ Push gesendet! Schau auf deinen Bildschirm.");
    } catch (e: any) {
      alert("❗️Fehler: " + (e?.message || e));
      add("Fehler: " + (e?.message || String(e)));
    }
  }

  return (
    <div style={{display:"grid", gap:12}}>
      <button onClick={enablePush}>🔔 Push aktivieren</button>
      <pre style={{whiteSpace:"pre-wrap", fontSize:12, background:"#1112", padding:8, borderRadius:8}}>{log}</pre>
    </div>
  );
}

function toKey(v: string) {
  const p = "=".repeat((4 - (v.length % 4)) % 4);
  const s = (v + p).replace(/-/g, "+").replace(/_/g, "/");
  const r: string = atob(s);
  const arr = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) arr[i] = r.charCodeAt(i);
  return arr;
}
