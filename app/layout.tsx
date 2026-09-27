import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dra. Glenys Nina Cuevas | Pediatría y Nutrición Clínica",
  description: "Pediatra y nutrióloga clínica en San Cristóbal. Información, orientación y acompañamiento para la salud y nutrición infantil.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
