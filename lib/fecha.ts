/** "2026-09-20 14:00:00" (UTC) → "20 de septiembre de 2026" (hora de República Dominicana). */
export function fechaLarga(iso?: string | null) {
  if (!iso) return "Nueva publicación";
  const d = new Date(iso.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? iso.slice(0, 10)
    : d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santo_Domingo" });
}
