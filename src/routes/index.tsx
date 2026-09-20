import { createFileRoute } from "@tanstack/react-router";
import {
  Calculator,
  WifiOff,
  UserX,
  Zap,
  ClipboardList,
  HardHat,
  Wrench,
  Ruler,
} from "lucide-react";
import { ShotcreteCalculator } from "@/components/ShotcreteCalculator";
import { InstallButton } from "@/components/Pwa";
import heroTunnel from "@/assets/hero-tunnel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDR — Cálculo de Volúmenes de Shotcrete" },
      {
        name: "description",
        content:
          "Calculadora offline de volúmenes de shotcrete y calibradores (gauge pins) para supervisores y jefes de guardia en minería subterránea. Sin login, sin internet.",
      },
      { property: "og:title", content: "PDR — Cálculo de Volúmenes de Shotcrete" },
      {
        property: "og:description",
        content:
          "Volúmenes y calibradores al instante en labores subterráneas. 100% offline, sin registros.",
      },
    ],
  }),
  component: Index,
});

const beneficios = [
  {
    icon: WifiOff,
    title: "100% Offline",
    desc: "Funciona sin internet dentro de la mina. Instálala una vez y úsala siempre.",
  },
  {
    icon: UserX,
    title: "Sin registros ni login",
    desc: "Ábrela y calcula. Nada de cuentas, contraseñas ni esperas.",
  },
  {
    icon: Zap,
    title: "Tiempo real",
    desc: "Los resultados se actualizan al instante mientras digitas las medidas.",
  },
  {
    icon: ClipboardList,
    title: "Listo para reporte",
    desc: "Copia el reporte con un toque y pégalo en WhatsApp o tu reporte de guardia.",
  },
];

function TunnelDiagram() {
  return (
    <svg
      viewBox="0 0 560 380"
      className="w-full max-w-xl"
      role="img"
      aria-label="Esquema de sección de túnel con cotas H, A y L"
    >
      {/* Tunnel cross-section (arch) */}
      <path
        d="M120 320 L120 170 Q120 60 280 60 Q440 60 440 170 L440 320 Z"
        fill="oklch(0.24 0.016 264)"
        stroke="oklch(0.79 0.16 82)"
        strokeWidth="4"
      />
      {/* Floor */}
      <line x1="60" y1="320" x2="500" y2="320" stroke="oklch(0.55 0.02 260)" strokeWidth="3" />
      {/* Depth lines suggesting L */}
      <path
        d="M440 170 L500 130 M440 320 L500 280 M500 280 L500 130"
        stroke="oklch(0.55 0.02 260)"
        strokeWidth="2"
        strokeDasharray="6 6"
        fill="none"
      />
      <path
        d="M120 170 L60 130 M60 130 L60 280 M120 320 L60 280"
        stroke="oklch(0.55 0.02 260)"
        strokeWidth="2"
        strokeDasharray="6 6"
        fill="none"
        opacity="0.4"
      />
      {/* Cota A (ancho) */}
      <line x1="120" y1="345" x2="440" y2="345" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <line x1="120" y1="336" x2="120" y2="354" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <line x1="440" y1="336" x2="440" y2="354" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <text x="280" y="370" textAnchor="middle" fill="oklch(0.79 0.16 82)" fontSize="22" fontWeight="700">
        A — Ancho
      </text>
      {/* Cota H (altura) */}
      <line x1="90" y1="60" x2="90" y2="320" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <line x1="81" y1="60" x2="99" y2="60" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <line x1="81" y1="320" x2="99" y2="320" stroke="oklch(0.79 0.16 82)" strokeWidth="2" />
      <text x="62" y="195" textAnchor="middle" fill="oklch(0.79 0.16 82)" fontSize="22" fontWeight="700" transform="rotate(-90 62 195)">
        H — Altura
      </text>
      {/* Cota L (avance) */}
      <line x1="440" y1="170" x2="500" y2="130" stroke="oklch(0.95 0.008 250)" strokeWidth="3" />
      <text x="500" y="115" textAnchor="middle" fill="oklch(0.95 0.008 250)" fontSize="22" fontWeight="700">
        L — Avance
      </text>
      {/* Perimeter hint */}
      <text x="280" y="200" textAnchor="middle" fill="oklch(0.95 0.008 250)" fontSize="18" fontWeight="600" opacity="0.85">
        Perímetro P = 2H + A
      </text>
      <text x="280" y="228" textAnchor="middle" fill="oklch(0.68 0.02 255)" fontSize="15">
        hastiales + corona
      </text>
    </svg>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary">
              <HardHat className="size-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-bold uppercase tracking-wide">
              PDR <span className="text-primary">Shotcrete</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <InstallButton className="hidden sm:inline-flex items-center gap-2 rounded-lg border-2 border-input px-4 py-2 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary" />
            <a
              href="#calculadora"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-all hover:brightness-110"
            >
              <Calculator className="size-4" /> Calcular
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroTunnel}
          alt="Túnel minero subterráneo con shotcrete"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <p className="mb-4 inline-block rounded-full border border-primary/50 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Para supervisores y jefes de guardia
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            Volúmenes de shotcrete{" "}
            <span className="text-primary">al instante</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Calcula volúmenes contractuales y reales (1" y 2") y la cantidad de
            calibradores en labores subterráneas. Sin login, sin internet, sin
            hojas de cálculo: directo desde tu celular o tablet en campo.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#calculadora"
              className="inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-8 font-display text-2xl font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_32px_-8px] shadow-primary/70 transition-all hover:brightness-110"
            >
              <Calculator className="size-6" /> Abrir calculadora
            </a>
            <InstallButton />
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculadora" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-8 sm:py-14">
        <ShotcreteCalculator />
      </section>

      {/* Avance vs Resane */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          Dos modos, <span className="text-primary">una herramienta</span>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/15">
              <Ruler className="size-6 text-primary" />
            </div>
            <h3 className="font-display text-3xl font-bold uppercase">Modo Avance</h3>
            <p className="mt-3 text-muted-foreground">
              Para labores de avance en túneles y galerías. Cálculo perimetral de
              hastiales y corona: ingresa Altura (H), Ancho (A) y Avance (L) y
              obtén el perímetro, el área a shotcretear, el volumen contractual y
              los volúmenes reales para espesores de 1" y 2" con factor de
              sacrificio, más los calibradores requeridos.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>· P = 2H + A · Área = P × L</li>
              <li>· Contrato = V_base + 0.20 m³</li>
              <li>· Real 1" = Área × 0.0254 × SH · Real 2" = 2 × Real 1"</li>
            </ul>
          </div>
          <div className="rounded-2xl border-2 border-border bg-card p-6 sm:p-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/15">
              <Wrench className="size-6 text-primary" />
            </div>
            <h3 className="font-display text-3xl font-bold uppercase">Modo Resane</h3>
            <p className="mt-3 text-muted-foreground">
              Para reparación y mantenimiento de secciones específicas ya
              shotcretadas. Ingresa Altura (H) y Avance (L) del tramo a resanar y
              obtén el área, el volumen de resane (Área / 11.5) y la cantidad de
              calibradores según la distribución en filas.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>· Área = H × L · Volumen = Área / 11.5</li>
              <li>· Calibradores = filas(H) × columnas(L − 1)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Diagram */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
              Qué medir, <span className="text-primary">sin dudas</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              El esquema muestra la sección típica de la labor: la altura H del
              piso a la corona, el ancho A entre hastiales y el avance L del
              frente. Con esas tres medidas la app hace el resto.
            </p>
          </div>
          <div className="flex justify-center rounded-2xl border border-border bg-background/60 p-6">
            <TunnelDiagram />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight sm:text-5xl">
          Hecha para <span className="text-primary">el campo</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-6">
              <b.icon className="size-7 text-primary" />
              <h3 className="mt-4 font-display text-2xl font-bold uppercase">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <a
            href="#calculadora"
            className="inline-flex h-14 items-center gap-2 rounded-lg bg-primary px-8 font-display text-2xl font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110"
          >
            <Calculator className="size-6" /> Empezar a calcular
          </a>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="hazard-stripes h-2" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
          <span className="font-display text-lg font-bold uppercase tracking-wide">
            PDR <span className="text-primary">Shotcrete</span>
          </span>
          <span>Cálculo de volúmenes y calibradores · Funciona 100% offline</span>
        </div>
      </footer>
    </div>
  );
}
