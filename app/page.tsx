import Image from "next/image";
import { BlogSection, GallerySection, InstagramCarousel, NewsletterForm } from "./InteractiveSections";
import { SiteFooter, SiteHeader, WhatsAppFloat } from "./SiteChrome";
import { buildPostList } from "../lib/posts";
import { CENTRO, DIRECCION, HORARIO, INSTAGRAM_URL, MAP_EMBED, MAP_URL, TELEFONO, WHATSAPP_URL } from "../lib/site";

const preguntas: Array<{ p: string; r: string }> = [
  { p: "¿Cómo agendo una consulta?", r: `Escríbenos por WhatsApp al ${TELEFONO}. Te respondemos para confirmar el día y la hora que mejor te convengan.` },
  { p: "¿Qué días atiende la doctora?", r: `${HORARIO}, en el ${CENTRO}, ${DIRECCION}.` },
  { p: "¿Qué edades atiende?", r: "Recién nacidos, niños y adolescentes, desde los primeros días de vida hasta el final de la adolescencia." },
  { p: "¿Solo atiende a niños con problemas de peso?", r: "No. Puedes venir a controles de niño sano y seguimiento del crecimiento, y también a orientación nutricional: alimentación complementaria, hábitos saludables o necesidades específicas." },
  { p: "¿Qué debo llevar a la primera consulta?", r: "La tarjeta de vacunas, estudios o análisis previos, los medicamentos o suplementos que toma y tus preguntas anotadas. Si la consulta es por alimentación, ayuda mucho anotar lo que come durante dos o tres días." },
  { p: "¿Aceptan seguro médico (ARS)?", r: "Escríbenos por WhatsApp con el nombre de tu ARS y te confirmamos la cobertura antes de la cita." },
  { p: "¿Puedo consultar por comentarios o redes sociales?", r: "El blog y las redes son informativos. Para evaluar a tu hijo y darte indicaciones personalizadas es necesaria una consulta." },
];

const pasos = [
  { n: "01", t: "Agenda por WhatsApp", d: "Cuéntanos el motivo de la consulta y la edad de tu hijo. Te confirmamos día y hora." },
  { n: "02", t: "Prepara tu visita", d: "Trae la tarjeta de vacunas, estudios previos, medicamentos que toma y tus preguntas anotadas." },
  { n: "03", t: "Evaluación completa", d: "Historia clínica, peso, talla y curvas de crecimiento, desarrollo y hábitos de alimentación." },
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
    medicalSpecialty: ["Pediatric", "DietNutrition"],
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
            <p className="eyebrow">Pediatría + Nutrición clínica · San Cristóbal</p>
            <h1>
              Cuidar su infancia<span className="dot dot-green">.</span><br />
              Nutrir su futuro<span className="dot dot-pink">.</span>
            </h1>
            <p className="hero-intro">
              Soy la Dra. Glenys Nina Cuevas. Acompaño a las familias con una atención
              pediátrica cercana y nutrición basada en evidencia.
            </p>
            <div className="hero-buttons">
              <a className="button button-green" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar consulta</a>
              <a className="text-link" href="#primera-consulta">Cómo es tu primera consulta <span>→</span></a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="organic-shape" />
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

        <section className="info-strip" aria-label="Datos de la consulta">
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
          <div className="about-visual">
            <div className="about-photo-wrap about-monogram">
              <Image src="/assets/logo-gn.webp" width={400} height={400} alt="" unoptimized />
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
            <blockquote className="about-quote">
              “Mi misión es acompañar a cada familia con ciencia y empatía, para que tomen decisiones
              informadas sobre la salud y la alimentación de sus hijos.”
            </blockquote>
            <div className="education-list" aria-label="Preparación profesional">
              <article><span>01</span><div><strong>Doctora en Medicina</strong><p>Base clínica orientada al cuidado integral de la salud.</p></div></article>
              <article><span>02</span><div><strong>Especialidad en Pediatría</strong><p>Prevención, diagnóstico y seguimiento desde la infancia.</p></div></article>
              <article><span>03</span><div><strong>Nutrición Clínica</strong><p>Evaluación nutricional y educación alimentaria personalizada.</p></div></article>
            </div>
          </div>
        </section>

        <section className="section specialties-section" id="especialidades">
          <div className="section-heading split-heading">
            <div>
              <p className="kicker">Servicios</p>
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

        <section className="section steps-section" id="primera-consulta">
          <div className="section-heading split-heading">
            <div>
              <p className="kicker">Tu primera consulta</p>
              <h2>Qué esperar, paso a paso</h2>
            </div>
            <p>Sin sorpresas: así es la primera visita con la Dra. Glenys, para que llegues con calma y aproveches cada minuto.</p>
          </div>
          <ol className="steps-grid">
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
          <div className="faq-heading">
            <p className="kicker">Preguntas frecuentes</p>
            <h2>Lo que más nos preguntan las familias</h2>
            <p>¿No encuentras tu respuesta? Escríbenos por WhatsApp y te ayudamos.</p>
            <a className="button button-pink" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Preguntar por WhatsApp</a>
          </div>
          <div className="faq-list">
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
          <div className="contact-map">
            <iframe title="Mapa: Centro Médico Constitución (CEMECO), San Cristóbal" src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }} />
    </>
  );
}
