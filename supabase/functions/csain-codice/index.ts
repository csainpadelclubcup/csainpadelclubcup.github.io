// Riconoscimento personale (livello 2) del sito CSAIN Padel Club Cup.
// azione "richiedi": cerca le righe della sezione con lo stesso nome, cognome e data di nascita
//   del profilo di chi chiede e manda un codice di 6 cifre alla mail scritta NELLA RIGA (non quella dell'account).
// azione "verifica": se il codice è giusto, le righe vengono aperte a quell'account.
import nodemailer from "npm:nodemailer@6.9.16";

const URL = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const H = { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const sha = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const mask = (m: string) => { const [a, d] = m.split("@"); return (a.slice(0, 2) + "*".repeat(Math.max(a.length - 2, 3))) + "@" + d; };
const rest = (p: string, o: RequestInit = {}) => fetch(`${URL}/rest/v1/${p}`, { ...o, headers: { ...H, ...(o.headers || {}) } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  let b: { azione?: string; codice?: string; sezione?: string } = {};
  try { b = await req.json(); } catch (_) { /* */ }
  const sez = String(b.sezione || "").trim();
  if (!sez) return out({ errore: "richiesta" }, 400);

  const ut = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: SK, Authorization: req.headers.get("Authorization") || "" } });
  if (!ut.ok) return out({ errore: "accesso" }, 401);
  const uid = (await ut.json()).id as string;

  if (b.azione === "richiedi") {
    const p = (await (await rest(`profili?id=eq.${uid}&select=nome,cognome,data_nascita`)).json())[0];
    if (!p || !p.nome || !p.cognome) return out({ errore: "manca_nome" });
    if (!p.data_nascita) return out({ errore: "manca_data" });
    const prec = (await (await rest(`csain_codici?user_id=eq.${uid}&sezione=eq.${encodeURIComponent(sez)}&select=creato`)).json())[0];
    if (prec && Date.now() - new Date(prec.creato).getTime() < 60000) return out({ errore: "attendi" });

    const a = norm(`${p.nome} ${p.cognome}`), c = norm(`${p.cognome} ${p.nome}`);
    const tutte = await (await rest(`csain_personale?sezione=eq.${encodeURIComponent(sez)}&select=id,nome,email,data_nascita`)).json();
    const trovate = (tutte as { id: string; nome: string; email: string; data_nascita: string }[])
      .filter((s) => (norm(s.nome) === a || norm(s.nome) === c) && String(s.data_nascita) === String(p.data_nascita));
    if (!trovate.length) return out({ trovata: false });
    const mail = [...new Set(trovate.map((s) => String(s.email || "").trim().toLowerCase()).filter(Boolean))];
    if (!mail.length) return out({ errore: "senza_mail" });

    const codice = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
    const row = { user_id: uid, sezione: sez, hash: await sha(codice + uid + sez), record_ids: trovate.map((s) => s.id), scade: new Date(Date.now() + 15 * 60000).toISOString(), tentativi: 0, creato: new Date().toISOString() };
    await rest("csain_codici?on_conflict=user_id,sezione", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(row) });

    // stessa casella già usata dal sito Sport & Services (secret SMTP_PASS); in futuro si possono impostare CSAIN_SMTP_*
    const host = Deno.env.get("CSAIN_SMTP_HOST") ?? "mail.flazio.com";
    const da = Deno.env.get("CSAIN_SMTP_USER") ?? "info@sportandservicespadel.it";
    const pass = Deno.env.get("CSAIN_SMTP_PASS") ?? Deno.env.get("SMTP_PASS") ?? "";
    const tx = nodemailer.createTransport({ host, port: 465, secure: true, auth: { user: da, pass } });
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;background:#F3F5F8;padding:20px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden">
<div style="background:#0B2545;color:#fff;padding:16px 22px;font-weight:bold;letter-spacing:1px">CSAIN PADEL CLUB CUP</div>
<div style="padding:22px;color:#0B2545;font-size:16px;line-height:1.5"><p style="margin:0 0 10px">Il tuo codice per aprire la tua area personale:</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:8px 0 14px">${codice}</p>
<p style="margin:0;font-size:14px;color:#5A6B80">Vale 15 minuti. Scrivilo nella pagina del sito dove l'hai chiesto. Se non l'hai chiesto tu, ignora questa mail.</p></div></div></div>`;
    try {
      await tx.sendMail({ from: `"CSAIN Padel Club Cup" <${da}>`, to: mail.join(", "), subject: "Il tuo codice per l'area personale", text: `Il tuo codice: ${codice}\nVale 15 minuti. Se non l'hai chiesto tu, ignora questa mail.`, html });
    } catch (e) { console.error(e); return out({ errore: "invio" }, 500); }
    return out({ trovata: true, mail: mail.map(mask) });
  }

  if (b.azione === "verifica") {
    const r = (await (await rest(`csain_codici?user_id=eq.${uid}&sezione=eq.${encodeURIComponent(sez)}&select=*`)).json())[0];
    if (!r || new Date(r.scade).getTime() < Date.now()) return out({ ok: false, errore: "scaduto" });
    if (r.tentativi >= 5) return out({ ok: false, errore: "troppi" });
    if (r.hash !== await sha(String(b.codice || "").trim() + uid + sez)) {
      await rest(`csain_codici?user_id=eq.${uid}&sezione=eq.${encodeURIComponent(sez)}`, { method: "PATCH", body: JSON.stringify({ tentativi: r.tentativi + 1 }) });
      return out({ ok: false, errore: "errato" });
    }
    await rest("csain_accessi?on_conflict=user_id,record_id", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(r.record_ids.map((id: string) => ({ user_id: uid, record_id: id }))) });
    await rest(`csain_codici?user_id=eq.${uid}&sezione=eq.${encodeURIComponent(sez)}`, { method: "DELETE" });
    return out({ ok: true });
  }
  return out({ errore: "richiesta" }, 400);
});
