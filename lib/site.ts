// Datos de contacto de la consulta, usados en todo el sitio.
export { WHATSAPP_URL } from "./api";

export const TELEFONO = "829-598-0131";
export const INSTAGRAM_URL = "https://www.instagram.com/dra.glenys_nutri/";
export const CENTRO = "Centro Médico Constitución — CEMECO";
export const DIRECCION = "Av. Constitución Sur no. 61, San Cristóbal, República Dominicana";
export const HORARIO_CORTO = "Lun 8:00 a. m.–1:00 p. m. · Vie desde 4:00 p. m.";
export const HORARIO = "Lunes 8:00 a. m. – 1:00 p. m. · Viernes desde las 4:00 p. m.";

const LUGAR = "Centro Médico Constitución CEMECO, Av. Constitución Sur 61, San Cristóbal, República Dominicana";
export const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LUGAR)}`;
export const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(LUGAR)}&output=embed&hl=es`;

/** Enlace de WhatsApp con un mensaje ya escrito. */
export const whatsapp = (texto: string) => `https://wa.me/18295980131?text=${encodeURIComponent(texto)}`;
