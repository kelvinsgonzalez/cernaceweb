import { CabeceraPublica, PiePublico } from "@/components/publico";

export default function LayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="visually-hidden">
        Saltar al contenido principal
      </a>
      <CabeceraPublica />
      <main id="contenido" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <PiePublico />
    </div>
  );
}
