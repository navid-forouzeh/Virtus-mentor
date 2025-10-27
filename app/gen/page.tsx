"use client";
import { useState } from "react";

export default function GenPage() {
  const [pub, setPub] = useState("");
  const [priv, setPriv] = useState("");
  const [err, setErr] = useState("");

  async function gen() {
    try {
      setErr(""); setPub(""); setPriv("");
      const subtle = crypto.subtle;
      const kp = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign","verify"]);
      // Public raw (unkomprimierter Punkt, 65 Bytes) => Base64URL (beginnt mit "B")
      const pubRaw = await subtle.exportKey("raw", kp.publicKey);
      const pubB64 = b64url(pubRaw);
      // Private: JWK.d ist Base64URL
      const jwk: any = await subtle.exportKey("jwk", kp.privateKey);
      setPub(pubB64);
      setPriv(jwk.d);
    } catch(e:any){ setErr(e?.message||String(e)); }
  }

  return (
    <main style={{padding:20}}>
      <h1>VAPID Key Generator (Browser)</h1>
      <button onClick={gen}>🔑 Keys erzeugen</button>
      {err && <p style={{color:"red"}}>Fehler: {err}</p>}
      {pub && <>
        <h3>Public Key (kopieren, beginnt mit B…)</h3>
        <textarea value={pub} readOnly style={{width:"100%",height:90}} />
        <h3>Private Key</h3>
        <textarea value={priv} readOnly style={{width:"100%",height:90}} />
      </>}
      <p style={{fontSize:12,opacity:.7}}>Diese Seite ist nur temporär – danach wieder löschen.</p>
    </main>
  );
}

function b64url(buf: ArrayBuffer) {
  let b = "";
  const bytes = new Uint8Array(buf);
  for (let i=0;i<bytes.length;i++) b += String.fromCharCode(bytes[i]);
  return btoa(b).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}