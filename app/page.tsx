import Image from "next/image";
import { BlogSection, GallerySection, InstagramCarousel, NewsletterForm } from "./InteractiveSections";
import { buildPostList } from "../lib/posts";

const WHATSAPP_URL =
  "https://wa.me/18295980131?text=Hola%20Dra.%20Glenys%2C%20deseo%20informaci%C3%B3n%20sobre%20una%20consulta.";

const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Centro+M%C3%A9dico+Constituci%C3%B3n+CEMECO+San+Crist%C3%B3bal+Rep%C3%BAblica+Dominicana";

const INSTAGRAM_URL = "https://www.instagram.com/dra.glenys_nutri/";

export default async function Home() {
  const posts = await buildPostList();
  const ultimo = posts[0];
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ir al inicio">
          <Image src="/assets/logo-glenys.png" width={1988} height={602} alt="Dra. Glenys Nina, Pediatría y Nutrición" priority unoptimized />
        </a>
        <nav className="main-nav" aria-label="Navegación principal">
          <a className="active" href="#inicio">Inicio</a>
          <a href="#sobre-mi">Sobre mí</a>
          <a href="#especialidades">Especialidades</a>
          <a href="#blog">Blog</a>
          <a href="#galeria">Galería</a>
        </nav>
        <div className="header-actions">
          <a className="location-pill" href={MAP_URL} target="_blank" rel="noreferrer">
            <span aria-hidden="true">⌖</span> CEMECO · San Cristóbal
          </a>
          <a className="button button-pink" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contacto
          </a>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Abrir menú">Menú</summary>
          <nav aria-label="Navegación móvil">
            <a href="#sobre-mi">Sobre mí</a>
            <a href="#especialidades">Especialidades</a>
            <a href="#blog">Blog</a>
            <a href="#galeria">Galería</a>
            <a href="#contacto">Contacto</a>
          </nav>
        </details>
      </header>

      <section className="hero" id="inicio">
        <div className="story-rail" aria-hidden="true">
          <span />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Pediatría + Nutrición clínica</p>
          <h1>
            Cuidar su infancia<span className="dot dot-green">.</span><br />
            Nutrir su futuro<span className="dot dot-pink">.</span>
          </h1>
          <p className="hero-intro">
            Soy la Dra. Glenys Nina Cuevas. Acompaño a las familias con una atención
            pediátrica cercana y nutrición basada en evidencia.
          </p>
          <div className="hero-buttons">
            <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Agendar consulta
            </a>
            <a className="text-link" href="#sobre-mi">Conoce mi trayectoria <span>→</span></a>
          </div>
          <a className="hero-location" href={MAP_URL} target="_blank" rel="noreferrer">
            <span aria-hidden="true">⌖</span>
            <span>Centro Médico Constitución — CEMECO</span>
          </a>
        </div>

        <div className="hero-visual" aria-label="Espacio reservado para una fotografía de la Dra. Glenys Nina">
          <div className="organic-shape" />
          <div className="portrait-card">
            <Image
              className="hero-photo"
              src="/assets/hero-doctor.png"
              width={1000}
              height={1250}
              alt="Representación editorial de atención pediátrica y nutricional"
              priority
              unoptimized
            />
          </div>
          <a className="floating-story" href={ultimo ? `/blog/${ultimo.slug}/` : "#blog"}>
            <span>Nuevo en el blog</span>
            <strong>{ultimo?.title ?? "Consejos de pediatría y nutrición"}</strong>
            <em>Leer artículo →</em>
          </a>
        </div>
      </section>

      <section className="explore-strip" aria-label="Áreas principales">
        <div className="explore-lead">
          <p>Explora</p>
          <span>Recursos pensados para acompañarte en cada etapa de tu familia.</span>
        </div>
        <a className="topic-card green-card" href="#especialidades">
          <span className="topic-icon">◌</span>
          <span><strong>Consulta pediátrica</strong><small>Prevención, crecimiento y desarrollo.</small></span>
          <b>→</b>
        </a>
        <a className="topic-card pink-card" href="#especialidades">
          <span className="topic-icon">♡</span>
          <span><strong>Nutrición clínica</strong><small>Hábitos reales para cada etapa.</small></span>
          <b>→</b>
        </a>
        <a className="topic-card cream-card" href="#blog">
          <span className="topic-icon">⌁</span>
          <span><strong>Consejos para familias</strong><small>Información clara y confiable.</small></span>
          <b>→</b>
        </a>
      </section>

      <section className="section about-section" id="sobre-mi">
        <div className="about-visual">
          <div className="about-photo-wrap">
            <Image src="/assets/hero-doctor.png" width={1000} height={1250} alt="Representación editorial de una especialista en pediatría y nutrición" unoptimized />
          </div>
          <div className="credential-card">
            <span>Atención integral</span>
            <strong>Pediatría + Nutrición Clínica</strong>
            <small>Ciencia, cercanía y acompañamiento</small>
          </div>
        </div>
        <div className="about-copy">
          <p className="kicker">Sobre la doctora</p>
          <h2>Una mirada integral a la salud y el crecimiento infantil</h2>
          <p className="about-lead">
            La Dra. Glenys Nina Cuevas es pediatra y nutrióloga clínica. Su práctica combina
            el seguimiento del desarrollo infantil con una orientación nutricional adaptada
            a la realidad de cada familia.
          </p>
          <p>
            Su enfoque promueve consultas cercanas, explicaciones claras y decisiones basadas
            en evidencia, respetando el ritmo, las necesidades y el contexto de cada niño.
          </p>
          <div className="education-list" aria-label="Preparación profesional">
            <article><span>01</span><div><strong>Formación médica</strong><p>Base clínica orientada al cuidado integral de la salud.</p></div></article>
            <article><span>02</span><div><strong>Especialidad en Pediatría</strong><p>Prevención, diagnóstico y seguimiento desde la infancia.</p></div></article>
            <article><span>03</span><div><strong>Nutrición Clínica</strong><p>Evaluación nutricional y educación alimentaria personalizada.</p></div></article>
          </div>
        </div>
      </section>

      <section className="section purpose-section" aria-label="Misión y visión">
        <article className="purpose-card mission-card">
          <span>01 · Misión</span>
          <h2>Acompañar con ciencia y empatía</h2>
          <p>
            Brindar atención pediátrica y nutricional integral, cercana y basada en evidencia,
            ayudando a cada familia a tomar decisiones informadas para el bienestar de sus hijos.
          </p>
        </article>
        <article className="purpose-card vision-card">
          <span>02 · Visión</span>
          <h2>Familias informadas, infancias saludables</h2>
          <p>
            Ser una referencia de confianza en San Cristóbal para el cuidado infantil y la
            nutrición clínica, promoviendo hábitos sostenibles que acompañen toda la vida.
          </p>
        </article>
      </section>

      <section className="section specialties-section" id="especialidades">
        <div className="section-heading split-heading">
          <div>
            <p className="kicker">Áreas de atención</p>
            <h2>Dos especialidades, una visión completa</h2>
          </div>
          <p>Atención personalizada para acompañar el crecimiento, el desarrollo y la alimentación.</p>
        </div>
        <div className="specialty-grid">
          <article className="specialty-card specialty-pediatrics">
            <div className="specialty-number">01</div>
            <p>Pediatría</p>
            <h3>Cuidado integral en cada etapa</h3>
            <ul>
              <li>Consulta pediátrica y seguimiento del crecimiento</li>
              <li>Evaluación del desarrollo infantil</li>
              <li>Prevención y orientación familiar</li>
              <li>Seguimiento de salud y hábitos</li>
            </ul>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Consultar disponibilidad →</a>
          </article>
          <article className="specialty-card specialty-nutrition">
            <div className="specialty-number">02</div>
            <p>Nutrición clínica</p>
            <h3>Alimentación que respeta su realidad</h3>
            <ul>
              <li>Evaluación nutricional infantil</li>
              <li>Alimentación complementaria</li>
              <li>Orientación para hábitos saludables</li>
              <li>Planes adaptados a necesidades específicas</li>
            </ul>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Consultar disponibilidad →</a>
          </article>
        </div>
      </section>

      <BlogSection initialPosts={posts} />

      <GallerySection />

      <InstagramCarousel />
      <NewsletterForm />

      <section className="section contact-section" id="contacto">
        <div className="contact-copy">
          <p className="kicker">Contacto</p>
          <h2>Conversemos sobre la salud de tus hijos</h2>
          <p>Consulta pediátrica y nutricional en el Centro Médico Constitución — CEMECO, San Cristóbal.</p>
          <div className="contact-actions">
            <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
            <a className="button button-outline" href={MAP_URL} target="_blank" rel="noreferrer">Ver ubicación</a>
          </div>
        </div>
        <div className="contact-details">
          <article><span>01</span><div><small>Centro médico</small><strong>Constitución — CEMECO</strong></div></article>
          <article><span>02</span><div><small>Ubicación</small><strong>San Cristóbal, República Dominicana</strong></div></article>
          <article><span>03</span><div><small>Horario de consulta</small><strong>Lunes 8:00 a. m. – 1:00 p. m. · Viernes desde las 4:00 p. m.</strong></div></article>
          <article><span>04</span><div><small>Instagram</small><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@dra.glenys_nutri ↗</a></div></article>
          <article><span>05</span><div><small>WhatsApp</small><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">829-598-0131 ↗</a></div></article>
        </div>
      </section>

      <footer className="site-footer">
        <Image src="/assets/logo-glenys.png" width={1988} height={602} alt="Dra. Glenys Nina" unoptimized />
        <p>Información educativa. No sustituye una evaluación médica individual.</p>
        <div><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp</a><a href={MAP_URL} target="_blank" rel="noreferrer">Ubicación</a></div>
      </footer>
    </main>
  );
}
