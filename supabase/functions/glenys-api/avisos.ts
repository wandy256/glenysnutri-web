// Correo (Microsoft Graph, buzón MS_SENDER) y SMS (Twilio) — mismos secretos que sitio-publico.
let tokenCache: { valor: string; vence: number } | null = null;

export const correoConfigurado = () =>
  !!(Deno.env.get("MS_TENANT_ID") && Deno.env.get("MS_CLIENT_ID") && Deno.env.get("MS_CLIENT_SECRET") && Deno.env.get("MS_SENDER"));

async function tokenGraph(): Promise<string> {
  if (tokenCache && tokenCache.vence > Date.now() + 60_000) return tokenCache.valor;
  const r = await fetch(`https://login.microsoftonline.com/${Deno.env.get("MS_TENANT_ID")}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("MS_CLIENT_ID")!, client_secret: Deno.env.get("MS_CLIENT_SECRET")!,
      scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials",
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Microsoft login: ${j.error_description ?? j.error ?? r.status}`);
  tokenCache = { valor: j.access_token, vence: Date.now() + (Number(j.expires_in) || 3000) * 1000 };
  return tokenCache.valor;
}

export async function enviarCorreo(para: string, asunto: string, html: string): Promise<string> {
  if (!correoConfigurado()) return "error: correo no configurado";
  try {
    const r = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(Deno.env.get("MS_SENDER")!)}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await tokenGraph()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: asunto, body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: para } }],
        },
        saveToSentItems: false,
      }),
    });
    if (r.status === 202) return "ok";
    const j = await r.json().catch(() => ({}));
    return `error: Graph ${r.status} ${j?.error?.message ?? ""}`.trim();
  } catch (e) {
    return `error: ${String((e as Error).message ?? e)}`;
  }
}

export async function enviarSms(para: string, texto: string): Promise<string> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID"), tok = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = (Deno.env.get("TWILIO_SMS_FROM") || Deno.env.get("TWILIO_WHATSAPP_FROM") || "").replace(/^whatsapp:/, "");
  if (!sid || !tok || !from) return "error: SMS no configurado";
  let to = para.replace(/[^\d+]/g, "");
  if (!to.startsWith("+")) to = (to.length === 10 ? "+1" : "+") + to;
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(`${sid}:${tok}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: from, To: to, Body: texto }),
    });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.sid ? `ok ${j.sid}` : `error: ${j.message ?? r.status}`;
  } catch (e) {
    return `error: ${String((e as Error).message ?? e)}`;
  }
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function correoCodigo(nombre: string, codigo: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f3ec;font-family:Segoe UI,Arial,sans-serif;color:#302720">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#6b9a3a;padding:20px 26px;color:#ffffff;font-size:18px;font-weight:600">Dra. Glenys Nina · Panel del sitio</td></tr>
<tr><td style="padding:26px;font-size:15px;line-height:1.55">
<p style="margin:0 0 12px">Hola${nombre ? ", " + esc(nombre) : ""}:</p>
<p style="margin:0 0 18px">Tu código para entrar al panel de glenysnutri.com es:</p>
<p style="margin:0 0 18px;font-size:32px;letter-spacing:.3em;font-weight:700;color:#e2557f">${esc(codigo)}</p>
<p style="margin:0;font-size:13px;color:#7a6f66">Vence en 10 minutos. Si no lo pediste, ignora este correo.</p>
</td></tr>
<tr><td style="padding:14px 26px;background:#faf7f2;font-size:12px;color:#7a6f66">glenysnutri.com · Sitio administrado por WandyWise Web Services</td></tr>
</table></td></tr></table></body></html>`;
}

// ---------------------------------------------------------------- Twilio Verify (SMS con código)
function e164(t: string) {
  let to = t.replace(/[^\d+]/g, "");
  if (!to.startsWith("+")) to = (to.length === 10 ? "+1" : "+") + to;
  return to;
}
async function verifyPost(path: string, params: Record<string, string>) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID"), tok = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!sid || !tok) return { ok: false, status: 0, j: { message: "Twilio no configurado" } };
  const r = await fetch(`https://verify.twilio.com/v2${path}`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${sid}:${tok}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  // deno-lint-ignore no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, j };
}
/** Envía un código por SMS con Twilio Verify. Devuelve "ok" o el error como texto. */
export async function verifyEnviar(servicio: string, telefono: string): Promise<string> {
  const r = await verifyPost(`/Services/${servicio}/Verifications`, { To: e164(telefono), Channel: "sms", Locale: "es" });
  return r.ok ? "ok" : `error: ${r.j?.message ?? r.status}`;
}
/** Comprueba el código recibido por SMS. Devuelve "ok" si es correcto. */
export async function verifyComprobar(servicio: string, telefono: string, codigo: string): Promise<string> {
  const r = await verifyPost(`/Services/${servicio}/VerificationCheck`, { To: e164(telefono), Code: codigo });
  return r.ok && r.j?.status === "approved" ? "ok" : `error: ${r.j?.status ?? r.j?.message ?? r.status}`;
}
