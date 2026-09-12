import {
  Boxes,
  ClipboardCheck,
  HandHeart,
  Landmark,
  ShieldCheck,
  Users,
} from "lucide-react";
import { EnlaceBoton } from "@/components/ui";
import { HojaInfo, ListaHoja } from "@/components/hoja-info";

/* -------------------------------------------------------------------------
   Cómo ser padrino y cómo ayudar

   El texto es el del programa de apadrinamientos de CERNACE y el de la página
   «Cómo puede ayudarnos» del sitio anterior. Va en fichas que se abren encima
   de la galería: quien viene a ver a los niños no tiene que atravesar cuatro
   pantallas de reglamento, y quien quiere el detalle lo tiene a un toque.
   ------------------------------------------------------------------------- */

/** Lo que cubre el aporte mensual, tal como lo detalla el programa. */
const CUBRE = [
  "Consultas y controles médicos.",
  "Medicamentos e insumos.",
  "Viáticos para que la familia llegue al centro.",
  "Traslados a exámenes con especialistas en la capital, Huehuetenango y Quetzaltenango: neurología, pediatría, cardiología, oftalmología.",
];

const COMPROMISO_PADRINO = [
  "Hacer efectivo su depósito mensual antes del 25 de cada mes.",
  "Mantener comunicación con CERNACE, con el ahijado y con su familia, mostrando apoyo moral, humano y espiritual.",
  "Hacer donaciones extraordinarias en fechas especiales: cumpleaños, día del niño, navidad.",
  "Ser enlace dentro de su círculo familiar y social para que encontremos más padrinos.",
];

const COMPROMISO_CERNACE = [
  "Administrar, ejecutar e informar sobre cada centavo recibido, por medio de la secretaría.",
  "Comprar los insumos o beneficios, en efectivo o en especie, y distribuirlos.",
  "Establecer comunicación entre el padrino y la familia del usuario, o el usuario mismo.",
  "Informar sobre los avances y las situaciones más relevantes del ahijado con fotografías, cartas y videos.",
  "Promover a los padres de familia como los primeros responsables de la rehabilitación de sus hijos.",
];

const APORTE_FAMILIAS = [
  "Un día al mes de su tiempo, o cuatro horas semanales, como voluntariado en los servicios y trabajos de la institución.",
  "Un aporte mensual mínimo, según su realidad.",
  "Aportaciones en especie: frutas, víveres, alimentos no perecederos.",
];

const FORMAS_DE_AYUDAR = [
  {
    titulo: "Club de amigos",
    texto:
      "Una red de personas que apoya de forma activa los objetivos y las actividades de la institución, en lo económico, lo humano y lo social.",
    puntos: [
      "Promover a la institución en su entorno y atraer más colaboradores y socios.",
      "Apoyar financieramente con donaciones en efectivo y en especie.",
      "Organizar eventos solidarios, campañas y voluntariado.",
    ],
  },
  {
    titulo: "Programa de voluntariado",
    texto:
      "Puedes aportar tus habilidades, tu tiempo y tus servicios: psicólogos, estudiantes, médicos, enfermeras, cocineras y misioneros son parte del equipo que sostiene el centro.",
    puntos: [
      "Acompañamiento emocional, espiritual y educativo a los beneficiarios.",
      "Asistencia en emergencias y apoyo en las actividades de CERNACE.",
    ],
  },
  {
    titulo: "Ser canal de enlace",
    texto:
      "Multiplicar la causa también sostiene el centro: muchas familias llegaron porque alguien habló de nosotros.",
    puntos: [
      "Apadrinar a un niño o beneficiario.",
      "Difundir la labor de la institución en redes y medios.",
    ],
  },
  {
    titulo: "Donaciones en especie",
    texto:
      "Lo que entra en especie llega directo al servicio diario del centro.",
    puntos: [
      "Alimentos no perecederos, ropa y zapatos.",
      "Insumos médicos y de fisioterapia.",
      "Material psicodidáctico.",
    ],
  },
];

const CUENTAS = [
  {
    banco: "Banco Banrural, Guatemala",
    tipo: "Cuenta monetaria",
    numero: "353105163",
    titular:
      "Asociación Unidos para Ayudar al Desarrollo Integral de los Pueblos",
  },
  {
    banco: "Chase Bank, Estados Unidos",
    tipo: "Cuenta",
    numero: "643788912",
    titular: "Isaías Gálvez",
  },
];

export function SeccionComoAyudar() {
  return (
    <section
      className="border-b border-line bg-surface"
      aria-labelledby="como-ayudar-titulo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="revela flex flex-wrap items-end justify-between gap-4">
          <h2
            id="como-ayudar-titulo"
            className="font-heading text-2xl font-semibold text-ink sm:text-3xl"
          >
            ¿Cómo puedo ayudar?
          </h2>
          <EnlaceBoton href="/inscripcion/padrino" className="px-5 py-2.5">
            Quiero ser padrino
          </EnlaceBoton>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="revela">
            <HojaInfo
              id="programa"
              etiqueta="El programa de padrinos"
              resumen="Por qué existe y qué cubre tu aporte"
              icono={<HandHeart aria-hidden="true" className="size-5" />}
              titulo="El programa de padrinos"
              entradilla="Una red que sostiene, mes a mes, el proceso de un niño."
              pie={
                <EnlaceBoton href="/inscripcion/padrino">
                  Quiero ser padrino
                </EnlaceBoton>
              }
            >
              <p className="text-ink-soft">
                Las limitaciones económicas del centro y de las propias familias
                hacen muy difícil cubrir lo básico de la rehabilitación. Por eso
                el Padre Isaías y su equipo crearon el programa de
                apadrinamientos, como estrategia de apoyo para sacar adelante a
                estos niños en su proceso.
              </p>

              <h4 className="mt-6 font-heading text-lg font-semibold text-ink">
                Qué cubre tu aporte
              </h4>
              <ul className="mt-3 space-y-2">
                {CUBRE.map((punto) => (
                  <li key={punto} className="flex gap-2.5 text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-primary"
                    />
                    {punto}
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <MontoAporte
                  monto="Q100"
                  detalle="al mes, aportes nacionales"
                />
                <MontoAporte
                  monto="US$30"
                  detalle="al mes, aportes desde el extranjero"
                />
              </div>

              <p className="mt-6 text-ink-soft">
                Con ese donativo un niño, una niña o un adolescente continúa su
                rehabilitación y mejora su calidad de vida, y el efecto llega a
                su familia y a su comunidad.
              </p>
            </HojaInfo>
          </li>

          <li className="revela">
            <HojaInfo
              id="compromiso-padrino"
              etiqueta="Compromiso del padrino"
              resumen="Lo que se espera de quien apadrina"
              icono={<ClipboardCheck aria-hidden="true" className="size-5" />}
              titulo="Compromiso del padrino"
              entradilla="Cuatro acuerdos, ni uno más."
            >
              <ListaHoja puntos={COMPROMISO_PADRINO} />
            </HojaInfo>
          </li>

          <li className="revela">
            <HojaInfo
              id="compromiso-cernace"
              etiqueta="Compromiso de CERNACE"
              resumen="A qué nos comprometemos nosotros"
              icono={<ShieldCheck aria-hidden="true" className="size-5" />}
              titulo="Compromiso de CERNACE"
              entradilla="Lo que el centro le debe a cada padrino."
            >
              <ListaHoja
                puntos={COMPROMISO_CERNACE}
                marcadores={["A", "B", "C", "D", "E"]}
              />

              <h4 className="mt-6 font-heading text-lg font-semibold text-ink">
                Y las familias aportan de tres maneras
              </h4>
              <p className="mt-2 text-sm text-ink-soft">
                El apadrinamiento no sustituye a los padres: los acompaña.
              </p>
              <div className="mt-4">
                <ListaHoja puntos={APORTE_FAMILIAS} />
              </div>
            </HojaInfo>
          </li>

          <li className="revela">
            <HojaInfo
              id="otras-formas"
              etiqueta="Otras formas de ayudar"
              resumen="Club de amigos, voluntariado y enlace"
              icono={<Users aria-hidden="true" className="size-5" />}
              titulo="Otras formas de ayudar"
              entradilla="No todo el apoyo es dinero, y todo el apoyo cuenta."
              pie={
                <EnlaceBoton href="/contacto" variante="contorno">
                  Escríbenos
                </EnlaceBoton>
              }
            >
              <p className="text-ink-soft">
                Creemos que la colaboración y el apoyo mutuo son la clave para
                alcanzar nuestros objetivos. Puedes ofrecer tu tiempo, donar
                recursos o simplemente compartir nuestra misión con tus amigos:
                cada gesto cuenta.
              </p>

              <div className="mt-6 space-y-5">
                {FORMAS_DE_AYUDAR.map((forma) => (
                  <div
                    key={forma.titulo}
                    className="rounded-[var(--radius-md)] border border-line bg-canvas p-4"
                  >
                    <h4 className="font-heading text-lg font-semibold text-ink">
                      {forma.titulo}
                    </h4>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      {forma.texto}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {forma.puntos.map((punto) => (
                        <li
                          key={punto}
                          className="flex gap-2.5 text-sm text-ink-soft"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-primary"
                          />
                          {punto}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </HojaInfo>
          </li>

          <li className="revela">
            <HojaInfo
              id="donaciones-especie"
              etiqueta="Donaciones en especie"
              resumen="Qué se recibe y cómo entregarlo"
              icono={<Boxes aria-hidden="true" className="size-5" />}
              titulo="Donaciones en especie"
              entradilla="Lo que llega en especie se usa en el servicio diario del centro."
              pie={
                <EnlaceBoton href="/contacto" variante="contorno">
                  Coordinar una entrega
                </EnlaceBoton>
              }
            >
              <ul className="space-y-2">
                {[
                  "Alimentos no perecederos, frutas y víveres.",
                  "Ropa y zapatos en buen estado.",
                  "Insumos médicos y de fisioterapia.",
                  "Material psicodidáctico y material adaptado.",
                  "Ayudas técnicas: sillas de ruedas, bastones, andadores.",
                ].map((punto) => (
                  <li key={punto} className="flex gap-2.5 text-ink-soft">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-primary"
                    />
                    {punto}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm text-ink-soft">
                Escríbenos antes de traer una donación grande: así coordinamos
                el día, el transporte y el espacio de bodega.
              </p>
            </HojaInfo>
          </li>

          <li className="revela">
            <HojaInfo
              id="cuentas"
              etiqueta="Dónde depositar"
              resumen="Cuentas bancarias y PayPal"
              icono={<Landmark aria-hidden="true" className="size-5" />}
              titulo="Dónde depositar tu aporte"
              entradilla="Cuentas de la asociación para el aporte mensual."
              pie={
                <EnlaceBoton href="/donar">Donar en línea</EnlaceBoton>
              }
            >
              <div className="space-y-4">
                {CUENTAS.map((cuenta) => (
                  <div
                    key={cuenta.numero}
                    className="rounded-[var(--radius-md)] border border-line bg-canvas p-4"
                  >
                    <h4 className="font-heading text-lg font-semibold text-ink">
                      {cuenta.banco}
                    </h4>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-ink-soft">{cuenta.tipo}:</dt>
                        <dd className="font-semibold tracking-wide text-ink">
                          {cuenta.numero}
                        </dd>
                      </div>
                      <div className="flex flex-wrap gap-x-2">
                        <dt className="text-ink-soft">A nombre de:</dt>
                        <dd className="text-ink">{cuenta.titular}</dd>
                      </div>
                    </dl>
                  </div>
                ))}

                <div className="rounded-[var(--radius-md)] border border-line bg-canvas p-4">
                  <h4 className="font-heading text-lg font-semibold text-ink">
                    PayPal
                  </h4>
                  <p className="mt-2 text-sm text-ink-soft">
                    Donación única o mensual a{" "}
                    <a
                      href="mailto:donacionescernace@gmail.com"
                      className="font-semibold text-brand-primary underline underline-offset-4"
                    >
                      donacionescernace@gmail.com
                    </a>
                    .
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-ink-soft">
                Después de depositar, envíanos el comprobante: así queda
                registrado en el expediente de tu ahijado y recibes el informe
                de sus avances.
              </p>
            </HojaInfo>
          </li>
        </ul>
      </div>
    </section>
  );
}

function MontoAporte({ monto, detalle }: { monto: string; detalle: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-brand-primary/25 bg-brand-sky p-4">
      <p className="font-heading text-2xl font-semibold text-brand-dark">
        {monto}
      </p>
      <p className="mt-0.5 text-sm text-ink-soft">{detalle}</p>
    </div>
  );
}
