import type { NextConfig } from "next";

// Sitio 100 % estático para GitHub Pages: `npm run build` genera la carpeta out/.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
