import Image from "next/image";
import Link from "next/link";
import { CENTRO, HORARIO_CORTO, INSTAGRAM_URL, MAP_URL, TELEFONO, WHATSAPP_URL, whatsapp } from "../lib/site";

type Seccion = "inicio" | "blog";

const enlaces = [
  { href: "/#sobre-mi", texto: "Sobre mí" },
  { href: "/#especialidades", texto: "Servicios" },
  { href: "/#primera-consulta", texto: "Tu consulta" },
  { href: "/blog/", texto: "Blog", seccion: "blog" as Seccion },
  { href: "/#contacto", texto: "Contacto" },
];

/** Franja con horario y contacto + encabezado fijo con menú. */
export function SiteHeader({ activo = "inicio" }: { activo?: Seccion }) {
  return (
    <>
      <div className="top-bar">
        <span><b>Horario</b> {HORARIO_CORTO}</span>
        <a className="top-bar-place" href={MAP_URL} target="_blank" rel="noreferrer">{CENTRO}, San Cristóbal</a>
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp {TELEFONO}</a>
      </div>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Ir al inicio">
          <Image src="/assets/logo-glenys.webp" width={700} height={212} alt="Dra. Glenys Nina, Pediatría y Nutrición" priority unoptimized />
        </Link>
        <nav className="main-nav" aria-label="Navegación principal">
          {enlaces.map((e) => <Link key={e.href} className={e.seccion === activo ? "active" : ""} href={e.href}>{e.texto}</Link>)}
        </nav>
        <div className="header-actions">
          <a className="button button-pink" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar consulta</a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Abrir menú">Menú</summary>
          <nav aria-label="Navegación móvil">
            {enlaces.map((e) => <Link key={e.href} href={e.href}>{e.texto}</Link>)}
            <a className="mobile-menu-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar por WhatsApp</a>
          </nav>
        </details>
      </header>
    </>
  );
}

/** Botón flotante de WhatsApp, siempre visible. */
export function WhatsAppFloat({ texto = "Hola Dra. Glenys, deseo agendar una consulta." }: { texto?: string }) {
  return (
    <a className="whatsapp-float" href={whatsapp(texto)} target="_blank" rel="noreferrer" aria-label="Escribir por WhatsApp para agendar">
      <svg viewBox="0 0 32 32" aria-hidden="true" width="28" height="28">
        <path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3 14.4 14.4 0 0 0 5.5 4.9c2 .9 2.8.9 3.8.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.4Z" />
      </svg>
      <span>Agendar</span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Image src="/assets/logo-glenys.webp" width={700} height={212} alt="Dra. Glenys Nina" unoptimized />
        <p>Pediatría y nutrición clínica en San Cristóbal.</p>
      </div>
      <nav aria-label="Enlaces del pie">
        <Link href="/#sobre-mi">Sobre mí</Link>
        <Link href="/#primera-consulta">Tu primera consulta</Link>
        <Link href="/#preguntas">Preguntas frecuentes</Link>
        <Link href="/blog/">Blog</Link>
      </nav>
      <nav aria-label="Contacto">
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp {TELEFONO}</a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram @dra.glenys_nutri</a>
        <a href={MAP_URL} target="_blank" rel="noreferrer">Cómo llegar</a>
      </nav>
      <p className="footer-note">Información educativa. No sustituye una evaluación médica individual. © {new Date().getFullYear()} Dra. Glenys Nina Cuevas.</p>
    </footer>
  );
}
