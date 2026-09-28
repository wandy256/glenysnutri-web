import type { Metadata } from "next";
import "./globals.css";

const DESCRIPTION = "Pediatra y nutrióloga clínica en San Cristóbal. Información, orientación y acompañamiento para la salud y nutrición infantil.";

export const metadata: Metadata = {
  metadataBase: new URL("https://glenysnutri.com"),
  title: "Dra. Glenys Nina Cuevas | Pediatría y Nutrición Clínica",
  description: DESCRIPTION,
  openGraph: {
    type: "website", url: "https://glenysnutri.com/", locale: "es_DO", siteName: "Dra. Glenys Nina Cuevas",
    title: "Dra. Glenys Nina Cuevas | Pediatría y Nutrición Clínica", description: DESCRIPTION,
    images: [{ url: "/assets/hero-doctor.png" }],
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Manrope:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
