import Image from "next/image";
import { Contador, Motion } from "./Motion";
import { BlogSection, GallerySection, InstagramCarousel, NewsletterForm } from "./InteractiveSections";
import { SiteFooter, SiteHeader, WhatsAppFloat } from "./SiteChrome";
import { buildPostList } from "../lib/posts";
import { CENTRO, DIRECCION, HORARIO, INSTAGRAM_URL, MAP_EMBED, MAP_URL, TELEFONO, WHATSAPP_URL } from "../lib/site";

const preguntas: Array<{ p: string; r: string }> = [
  { p: "¿Cómo agendo una consulta?", r: `Escríbenos por WhatsApp al ${TELEFONO}. Te respondemos para confirmar el día y la hora que mejor te convengan.` },
  { p: "¿Qué días atiende la doctora?", r: `${HORARIO}, en el ${CENTRO}, ${DIRECCION}.` },
  { p: "¿Aceptan seguro médico (ARS)?", r: "Sí. La doctora acepta todas las ARS, incluidas las principales aseguradoras del país. Lleva tu carnet del seguro el día de la consulta." },
  { p: "¿Cuánto dura la consulta?", r: "La consulta pediátrica dura entre 15 y 30 minutos. La primera consulta de nutrición pediátrica, entre 30 y 40 minutos. La consulta nutricional para adultos, entre 45 minutos y 1 hora." },
  { p: "¿Qué debo llevar a la primera consulta?", r: "La cartilla de vacunas del niño y tu carnet del seguro. Si tienes análisis o estudios recientes, llévalos también." },
  { p: "¿Qué edades atiende?", r: "Niños desde recién nacidos hasta la adolescencia en pediatría y nutrición pediátrica. También ofrece consulta nutricional para adultos." },
  { p: "¿Solo atiende a niños con problemas de peso?", r: "No. Puedes venir a controles de niño sano y seguimiento del crecimiento, y también a orientación nutricional: alimentación complementaria, hábitos saludables o necesidades específicas." },
  { p: "¿Puedo consultar por comentarios o redes sociales?", r: "El blog y las redes son informativos. Para evaluar a tu hijo y darte indicaciones personalizadas es necesaria una consulta." },
];

const pasos = [
  { n: "01", t: "Agenda por WhatsApp", d: "Cuéntanos el motivo de la consulta y la edad de tu hijo. Te confirmamos día y hora." },
  { n: "02", t: "Prepara tu visita", d: "Lleva la cartilla de vacunas y tu carnet del seguro. Se aceptan todas las ARS." },
  { n: "03", t: "Evaluación completa", d: "Historia clínica, peso, talla, curvas de crecimiento y alimentación. Pediatría: 15–30 min · Nutrición: 30–40 min la primera vez." },
  { n: "04", t: "Plan claro y seguimiento", d: "Sales con indicaciones por escrito, adaptadas a tu familia, y la fecha de tu próximo control." },
];

const datosEstructurados = [
  {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "Dra. Glenys Nina Cuevas",
    description: "Pediatra y nutrióloga clínica en San Cristóbal, República Dominicana.",
    url: "https://glenysnutri.com/",
    image: "https://glenysnutri.com/assets/hero-doctor.jpg",
    telephone: "+1-829-598-0131",
    medicalSpecialty: ["Pediatric", "DietNutrition", "PrimaryCare"],
    alumniOf: ["Universidad Autónoma de Santo Domingo (UASD)", "Instituto Tecnológico de Santo Domingo (INTEC)"],
    address: { "@type": "PostalAddress", streetAddress: "Av. Constitución Sur no. 61, Centro Médico Constitución (CEMECO)", addressLocality: "San Cristóbal", addressCountry: "DO" },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "08:00", closes: "13:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "16:00" },
    ],
    sameAs: [INSTAGRAM_URL],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: preguntas.map((q) => ({ "@type": "Question", name: q.p, acceptedAnswer: { "@type": "Answer", text: q.r } })),
  },
];

export default async function Home() {
  const posts = await buildPostList();
  const ultimo = posts[0];
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" id="inicio">
          <div className="story-rail" aria-hidden="true"><span /></div>
          <div className="hero-copy">
            <p className="eyebrow" data-reveal>Pediatría + Nutrición clínica · San Cristóbal</p>
            <h1 className="hero-title">
              <span className="line"><span>Cuidar su infancia<span className="dot dot-green">.</span></span></span>
              <span className="line"><span>Nutrir su futuro<span className="dot dot-pink">.</span></span></span>
            </h1>
            <p className="hero-intro" data-reveal style={{ ["--d" as string]: "500ms" }}>
              Soy la Dra. Glenys Nina Cuevas, pediatra y nutrióloga pediátrica con 18 años de
              experiencia. Acompaño a las familias con una atención cercana y basada en evidencia.
            </p>
            <div className="hero-buttons" data-reveal style={{ ["--d" as string]: "650ms" }}>
              <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar consulta</a>
              <a className="text-link" href="#primera-consulta">Cómo es tu primera consulta <span>→</span></a>
            </div>
          </div>

          <div className="hero-visual" data-reveal="zoom">
            <div className="organic-shape" />
            <span className="float-dot fd-1" aria-hidden="true" /><span className="float-dot fd-2" aria-hidden="true" /><svg className="float-leaf" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path fill="currentColor" d="M20 3C10 3 4 8 4 15c0 2 .6 3.6 1.4 4.8L3 22l1.4 1.4 2.4-2.5C8 21.6 9.6 22 11 22c7 0 11-7 9-19Zm-9 16.5c-1 0-2-.2-2.8-.7C11 16 13.7 13 17 10.5c-3.8 1.6-7 4.3-9.3 7.2A6.6 6.6 0 0 1 7 15c0-5 4-9 11-9.4.8 8-2.6 13.9-7 13.9Z"/></svg>
            <div className="portrait-card">
              <Image className="hero-photo" src="/assets/hero-doctor.webp" width={900} height={1125} alt="Atención pediátrica y nutricional" priority unoptimized />
            </div>
            {ultimo ? (
              <a className="floating-story" href={`/blog/${ultimo.slug}/`}>
                <span>Nuevo en el blog</span>
                <strong>{ultimo.title}</strong>
                <em>Leer artículo →</em>
              </a>
            ) : null}
          </div>
        </section>

        <section className="info-strip" aria-label="Datos de la consulta" data-reveal-group>
          <a className="info-card green-card" href="#contacto">
            <span className="info-icon" aria-hidden="true">◷</span>
            <span><small>Horario</small><strong>Lunes 8:00 a. m. – 1:00 p. m.</strong><strong>Viernes desde 4:00 p. m.</strong></span>
          </a>
          <a className="info-card cream-card" href={MAP_URL} target="_blank" rel="noreferrer">
            <span className="info-icon" aria-hidden="true">⌖</span>
            <span><small>Dónde</small><strong>CEMECO · Av. Constitución Sur 61</strong><em>San Cristóbal · Cómo llegar ↗</em></span>
          </a>
          <a className="info-card pink-card" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <span className="info-icon" aria-hidden="true">✆</span>
            <span><small>Citas por WhatsApp</small><strong>{TELEFONO}</strong><em>Escribir ahora ↗</em></span>
          </a>
        </section>

        <section className="section about-section" id="sobre-mi">
          <div className="about-visual" data-reveal="left">
            <div className="about-photo-wrap about-monogram">
              <Image src="/assets/logo-gn.webp" width={400} height={400} alt="" unoptimized />
            </div>
            <div className="credential-card">
              <span>Experiencia</span>
              <strong><Contador hasta={18} /> años</strong>
              <small>cuidando la salud de niños y familias</small>
            </div>
          </div>
          <div className="about-copy" data-reveal="right">
            <p className="kicker">Sobre la doctora</p>
            <h2>Una mirada integral a la salud y el crecimiento infantil</h2>
            <p className="about-lead">
              La Dra. Glenys Nina Cuevas es médico familiar y comunitaria, pediatra y
              especialista en nutrición médica pediátrica. Con 18 años de ejercicio, combina el
              seguimiento del desarrollo infantil con una orientación nutricional adaptada a la
              realidad de cada familia.
            </p>
            <blockquote className="about-quote">
              “Mi misión es acompañar a cada familia con ciencia y empatía, para que tomen decisiones
              informadas sobre la salud y la alimentación de sus hijos.”
            </blockquote>
            <ol className="education-list" aria-label="Formación profesional" data-reveal-group>
              <li><span>2006</span><div><strong>Doctora en Medicina</strong><p>Universidad Autónoma de Santo Domingo (UASD).</p></div></li>
              <li><span>2013</span><div><strong>Medicina Familiar y Comunitaria</strong><p>Hospital Universitario 12 de Octubre, Madrid, España.</p></div></li>
              <li><span>2017</span><div><strong>Especialidad en Pediatría</strong><p>Hospital Infantil Dr. Robert Reid Cabral · UASD.</p></div></li>
              <li><span>2022</span><div><strong>Nutrición Médica Pediátrica</strong><p>Instituto Tecnológico de Santo Domingo (INTEC).</p></div></li>
            </ol>
            <div className="stats" data-reveal-group>
              <div><strong><Contador hasta={18} /></strong><span>años de ejercicio</span></div>
              <div><strong><Contador hasta={3} /></strong><span>especialidades médicas</span></div>
              <div><strong>Todas</strong><span>las ARS aceptadas</span></div>
            </div>
          </div>
        </section>

        <div className="wave-divider" aria-hidden="true" data-reveal><svg viewBox="0 0 1440 90" preserveAspectRatio="none"><path d="M0 50 C 240 8, 420 86, 720 46 S 1200 14, 1440 52" /></svg></div>

        <section className="section specialties-section" id="especialidades">
          <div className="section-heading split-heading" data-reveal>
            <div>
              <p className="kicker">Servicios</p>
              <h2>Atención para toda la familia</h2>
            </div>
            <p>Pediatría y nutrición para niños y adolescentes, y consulta nutricional para adultos.</p>
          </div>
          <div className="specialty-grid" data-reveal-group>
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
            <article className="specialty-card specialty-adults">
              <div className="specialty-number">03</div>
              <p>Nutrición para adultos</p>
              <h3>Hábitos que cuidan a toda la casa</h3>
              <ul>
                <li>Evaluación nutricional completa</li>
                <li>Plan de alimentación personalizado</li>
                <li>Orientación para hábitos saludables</li>
                <li>Consulta de 45 minutos a 1 hora</li>
              </ul>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Consultar disponibilidad →</a>
            </article>
          </div>
        </section>

        <section className="section steps-section" id="primera-consulta">
          <div className="section-heading split-heading" data-reveal>
            <div>
              <p className="kicker">Tu primera consulta</p>
              <h2>Qué esperar, paso a paso</h2>
            </div>
            <p>Sin sorpresas: así es la primera visita con la Dra. Glenys, para que llegues con calma y aproveches cada minuto.</p>
          </div>
          <ol className="steps-grid" data-reveal-group>
            {pasos.map((paso) => (
              <li key={paso.n}><span>{paso.n}</span><strong>{paso.t}</strong><p>{paso.d}</p></li>
            ))}
          </ol>
          <a className="button button-green steps-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar mi primera consulta</a>
        </section>

        <BlogSection initialPosts={posts} limit={3} />

        <GallerySection />

        <InstagramCarousel />

        <section className="section faq-section" id="preguntas">
          <div className="faq-heading" data-reveal="left">
            <p className="kicker">Preguntas frecuentes</p>
            <h2>Lo que más nos preguntan las familias</h2>
            <p>¿No encuentras tu respuesta? Escríbenos por WhatsApp y te ayudamos.</p>
            <a className="button button-pink" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Preguntar por WhatsApp</a>
          </div>
          <div className="faq-list" data-reveal="right">
            {preguntas.map((q, i) => (
              <details key={q.p} open={i === 0}>
                <summary>{q.p}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </section>

        <NewsletterForm />

        <section className="section contact-section" id="contacto">
          <div className="contact-copy">
            <p className="kicker">Contacto</p>
            <h2>Conversemos sobre la salud de tus hijos</h2>
            <p>Consulta pediátrica y nutricional en el {CENTRO}, Av. Constitución Sur no. 61, San Cristóbal.</p>
            <div className="contact-details">
              <article><span>01</span><div><small>Horario de consulta</small><strong>{HORARIO}</strong></div></article>
              <article><span>02</span><div><small>Dirección</small><strong>{DIRECCION}</strong></div></article>
              <article><span>03</span><div><small>WhatsApp</small><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">{TELEFONO} ↗</a></div></article>
              <article><span>04</span><div><small>Instagram</small><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">@dra.glenys_nutri ↗</a></div></article>
            </div>
            <div className="contact-actions">
              <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
              <a className="button button-outline" href={MAP_URL} target="_blank" rel="noreferrer">Cómo llegar</a>
            </div>
          </div>
          <div className="contact-map" data-reveal="zoom">
            <iframe title="Mapa: Centro Médico Constitución (CEMECO), San Cristóbal" src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <Motion />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
    </>
  );
}
