import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

/* Fraunces para los títulos: serif variable, cálida y con carácter propio;
   el eje WONK acentúa sus remates en los tamaños grandes.
   Karla para el texto y los formularios: grotesca de lectura tranquila. */
const fraunces = Fraunces({
  variable: "--fuente-titulo",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const karla = Karla({
  variable: "--fuente-texto",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CERNACE — Educación y rehabilitación",
    template: "%s · CERNACE",
  },
  description:
    "Centro de Educación y Rehabilitación para Niños y Adolescentes con Capacidades Especiales, Chimaltenango, Guatemala.",
};

/* El color con el que el navegador de móvil pinta su propia barra: el marino
   institucional, para que la interfaz del teléfono no corte la pantalla. */
export const viewport: Viewport = {
  themeColor: "#0a1c3f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Las variables de tipografía van en <html>: `--font-heading` se resuelve en
  // `:root`, y declarándolas en <body> la sustitución fallaba y todo el sitio
  // caía al tipo del sistema.
  return (
    <html lang="es" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
