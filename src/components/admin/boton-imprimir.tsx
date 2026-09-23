"use client";

import { Printer } from "lucide-react";
import { Boton } from "@/components/ui";

/** Abre el diálogo de impresión del navegador. Al imprimir no sale. */
export function BotonImprimir({ etiqueta = "Imprimir" }: { etiqueta?: string }) {
  return (
    <Boton type="button" onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" className="size-4" />
      {etiqueta}
    </Boton>
  );
}
