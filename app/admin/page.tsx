"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminDashboard } from "./AdminDashboard";
import { api } from "../../lib/api";
import { getToken, setToken, subscribeUnauthorized } from "./session";
import "./admin.css";
import "./instagram-admin.css";
import "./login.css";

type User = { email: string; name: string; role: string };

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => subscribeUnauthorized(() => setUser(null)), []);

  useEffect(() => {
    const token = getToken();
    // La sesión se guarda en el navegador: solo se puede leer después de hidratar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!token) { setReady(true); return; }
    fetch(api("/admin/session"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => (r.ok ? ((await r.json()) as { user: User }).user : null))
      .then((u) => { if (!u) setToken(null); setUser(u); })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  function signOut() { setToken(null); setUser(null); }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="admin-brand"><Image src="/assets/logo-glenys.webp" width={700} height={212} alt="Dra. Glenys Nina" priority unoptimized /></Link>
        {user ? <div><span>{user.name}</span><a href="#" onClick={(e) => { e.preventDefault(); signOut(); }}>Cerrar sesión</a></div> : null}
      </header>
      {!ready ? <section className="admin-state"><div className="admin-loader" /><p>Preparando tu panel…</p></section>
        : user ? <AdminDashboard signedInEmail={user.email} />
        : <LoginForm onLogin={setUser} />}
    </main>
  );
}

function LoginForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function post<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(api(path), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as T & { error?: string };
    if (!r.ok) throw new Error(j.error ?? "No fue posible completar la solicitud");
    return j;
  }

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setError("");
    try {
      const r = await post<{ mensaje: string }>("/auth/solicitar", { email });
      setMensaje(r.mensaje); setPaso("codigo");
    } catch (err) { setError((err as Error).message); } finally { setEnviando(false); }
  }

  async function verificar(e: FormEvent) {
    e.preventDefault(); setEnviando(true); setError("");
    try {
      const r = await post<{ token: string; user: User }>("/auth/verificar", { email, codigo });
      setToken(r.token); onLogin(r.user);
    } catch (err) { setError((err as Error).message); } finally { setEnviando(false); }
  }

  return (
    <section className="admin-login">
      <div className="admin-login-card">
        <span>Panel privado</span>
        <h1>Entrar al panel</h1>
        {paso === "correo" ? (
          <form className="admin-form" onSubmit={pedirCodigo}>
            <p className="form-help">Escribe tu correo autorizado y te enviaremos un código de 6 dígitos.</p>
            <label>Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
            <button className="primary" type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviarme el código"}</button>
          </form>
        ) : (
          <form className="admin-form" onSubmit={verificar}>
            <p className="form-help">{mensaje}</p>
            <label>Código de 6 dígitos<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} required /></label>
            <button className="primary" type="submit" disabled={enviando || codigo.length !== 6}>{enviando ? "Verificando…" : "Entrar"}</button>
            <button type="button" className="link" onClick={() => { setPaso("correo"); setCodigo(""); setError(""); }}>Usar otro correo o pedir un código nuevo</button>
          </form>
        )}
        {error ? <p className="admin-login-error" role="alert">{error}</p> : null}
        <Link href="/">Volver a la página principal</Link>
      </div>
    </section>
  );
}
