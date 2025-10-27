"use client";
import { useEffect, useState } from "react";

export default function EnablePushButton() {
  const [log, setLog] = useState("Bereit.");
  const add = (m: string) => setLog((x) => x + "\n" + m);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(() => add("SW: registriert"))
        .catch((e) => add("SW-Fehler: " + (e?.message || e)));
    } else add("Kein ServiceWorker-Support.");
  }, []);

  async function enablePush() {
    try {
      add("Starte Diagnose …");

      // Public Key säubern + anzeigen
      let pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")
        .trim().replace(/^Public Key:\s*/i, "").replace(/\s+/g, "");
      add(`PUB(prefix): ${pub.slice(0, 8)}…`);

      // Server-Check
      const dbg = await fetch("/api/push/debug", { cache: "no-store" });
      const d = await dbg.json();
      if (!d?.env?.pub || !d?.env?.priv || !d?.env?.vapidOk)
        throw new Error("Server-ENV unvollständig.");
      add("Server/ENV: OK");

      // Permission
      const perm = await Notification.requestPermission();
      add("Permission: " + perm);
      if (perm !== "granted") throw new Error("Benachrichtigungen blockiert.");

      const reg = await navigator.serviceWorker.ready;

      // Altes Abo entfernen
      const old = await reg.pushManager.getSubscription();
      if (old) { await old.unsubscribe(); add("Altes Abo entfernt."); }

      // Key prüfen
      const keyBytes = toKey(pub);
      add(`KeyLen: ${keyBytes.length} Bytes`);
      if (keyBytes.length !== 65)
        throw new Error("Key-Länge ≠ 65 Bytes → falsches Format");

      // Neues Abo
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });
      add("Subscribed: OK");

      // Test-Push
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          title: "Guten Morgen, Navid 🌅",
          body: "Mentor-Push aktiv. Kleine Schritte – großer Effekt.",
          url: "/",
        }),
      });
      if (!res.ok) throw new Error("Server: " + (await res.text()));
      add("Server: Push gesendet ✅");
      alert("✅ Push gesendet! Schau auf deinen Bildschirm.");
    } catch (e: any) {
      add("Fehler: " + (e?.message || String(e)));
      alert("❗️Fehler: " + (e?.message || e));
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button onClick={enablePush}>🔔 Push aktivieren</button>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, background: "#1112", padding: 8, borderRadius: 8 }}>{log}</pre>
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