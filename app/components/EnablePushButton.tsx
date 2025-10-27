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

      // 0) PUBLIC KEY laden (ENV) + säubern
      let pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")
        .trim()
        .replace(/^Public Key:\s*/i, "")
        .replace(/\s+/g, "");
      add(`PUB(prefix): ${pub.slice(0, 8)}…`);

      // 1) Server/ENV prüfen
      const dbg = await fetch("/api/push/debug", { cache: "no-store" });
      const d = await dbg.json();
      if (!d?.env?.pub || !d?.env?.priv || !d?.env?.vapidOk) {
        throw new Error("ENV fehlt auf Server.");
      }
      add("Server/ENV: OK");

      // 2) Permission
      const perm = await Notification.requestPermission();
      add("Permission: " + perm);
      if (perm !== "granted") throw new Error("Benachrichtigungen blockiert.");

      // 3) SW bereit
      const reg = await navigator.serviceWorker.ready;

      // 4) altes Abo entfernen
      const old = await reg.pushManager.getSubscription();
      if (old) { try { await old.unsubscribe(); add("Altes Abo entfernt."); } catch {} }

      // 5) Key konvertieren (akzeptiert B-Key *oder* MFkw… SPKI)
      const keyBytes = toKey(pub);
      add(`KeyLen: ${keyBytes.length} Bytes`);
      if (keyBytes.length !== 65 || keyBytes[0] !== 0x04) {
        throw new Error("applicationServerKey must contain a valid P-256 public key");
      }

      // 6) neues Abo
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });
      add("Subscribed: OK");

      // 7) Test-Push senden
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

/** akzeptiert:
 *  - B… (roher P-256 Punkt, 65 Bytes, 0x04 | X(32) | Y(32))
 *  - MFkw… (SPKI DER) → extrahiert letzten 65 Bytes
 */
function toKey(v: string) {
  const p = "=".repeat((4 - (v.length % 4)) % 4);
  const s = (v + p).replace(/-/g, "+").replace(/_/g, "/");
  const raw = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  // B-Key (raw) → direkt
  if (raw.length === 65 && raw[0] === 0x04) return raw;

  // SPKI (ASN.1 SEQUENCE 0x30 …) → ECPoint am Ende (65 Bytes)
  if (raw.length > 70 && raw[0] === 0x30) {
    const last65 = raw.slice(raw.length - 65);
    if (last65[0] === 0x04) return last65;
  }

  throw new Error(`Ungültige Key-Länge (${raw.length})`);
}