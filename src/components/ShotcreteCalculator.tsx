import { useMemo, useState } from "react";
import { ClipboardCopy, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

// ---- Constantes de cálculo (ajustables según contrato) ----
const ESPESOR_PULGADA_M = 0.0254; // 1" en metros
const SH = 1.4594; // Factor de sacrificio
const TASA_CONTRACTUAL = 0.02916667; // m³ por m² (V_base) — verificado: 48 m² -> 1.400 m³
const SOBREESPESOR_CONTRACTUAL = 0.2; // m³ adicionales
const FC = 1; // Factor de espaciamiento de calibradores (avance, H <= 4.2)
const RESANE_RENDIMIENTO = 11.5; // m² por m³

type Mode = "avance" | "resane";

function parse(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const fmt = (n: number, d = 3) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt2 = (n: number) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function Field({ label, value, onChange, placeholder }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label} <span className="text-steel">(m)</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        placeholder={placeholder ?? "0.00"}
        onChange={(e) => onChange(e.target.value)}
        className="h-16 w-full rounded-lg border-2 border-input bg-secondary px-4 text-3xl font-bold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary"
      />
    </label>
  );
}

function ResultCard({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border-2 p-4 sm:p-5 ${
        highlight
          ? "border-primary bg-primary/10"
          : "border-border bg-secondary"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl font-bold tabular-nums leading-none sm:text-5xl">
        <span className={highlight ? "text-primary" : "text-foreground"}>{value}</span>{" "}
        <span className="text-lg font-semibold text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

export function ShotcreteCalculator() {
  const [mode, setMode] = useState<Mode>("avance");
  const [h, setH] = useState("");
  const [a, setA] = useState("");
  const [l, setL] = useState("");
  const [perimetro, setPerimetro] = useState("12");
  const [copied, setCopied] = useState(false);

  const r = useMemo(() => {
    const H = parse(h);
    const A = parse(a);
    const L = parse(l);
    if (mode === "avance") {
      const P = 2 * H + A;
      const area = P * L;
      const vBase = area * TASA_CONTRACTUAL;
      const vContract = area > 0 ? vBase + SOBREESPESOR_CONTRACTUAL : 0;
      const vReal1 = area * ESPESOR_PULGADA_M * SH;
      const vReal2 = vReal1 * 2;
      const calib =
        H <= 0
          ? 0
          : H > 4.2
            ? (H - 1) * 2 * 2
            : Math.ceil(P * FC - 1) * 2;
      return { P, area, vContract, vReal1, vReal2, calib };
    }
    const area = H * L;
    const vResane = area / RESANE_RENDIMIENTO;
    const filas = H < 1.9 ? 1 : Math.floor(H);
    const calib = H <= 0 || L <= 0 ? 0 : filas * Math.ceil(Math.max(L - 1, 0));
    return { P: parse(perimetro), area, vResane, calib, filas };
  }, [mode, h, a, l, perimetro]);

  const hasInput = mode === "avance" ? h || a || l : h || l;

  const reset = () => {
    setH("");
    setA("");
    setL("");
    setPerimetro("12");
    toast.success("Campos limpiados");
  };

  const copyReport = async () => {
    const lines =
      mode === "avance"
        ? [
            "REPORTE SHOTCRETE — MODO AVANCE",
            `Altura (H): ${h || 0} m | Ancho (A): ${a || 0} m | Avance (L): ${l || 0} m`,
            `Perímetro: ${fmt2(r.P)} m`,
            `Área: ${fmt2(r.area)} m²`,
            `Volumen contractual: ${fmt(r.vContract ?? 0)} m³`,
            `Volumen real 1": ${fmt(r.vReal1 ?? 0)} m³`,
            `Volumen real 2": ${fmt(r.vReal2 ?? 0)} m³`,
            `Calibradores: ${r.calib} und`,
          ]
        : [
            "REPORTE SHOTCRETE — MODO RESANE",
            `Altura (H): ${h || 0} m | Avance (L): ${l || 0} m | Perímetro: ${perimetro || 12} m`,
            `Área: ${fmt2(r.area)} m²`,
            `Volumen de resane: ${fmt2(r.vResane ?? 0)} m³`,
            `Calibradores: ${r.calib} und`,
          ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Reporte copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-2xl">
      <div className="hazard-stripes h-3" />

      {/* Mode switcher */}
      <div className="grid grid-cols-2 gap-2 p-4 sm:p-6">
        {(["avance", "resane"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`h-14 rounded-lg font-display text-2xl font-bold uppercase tracking-wider transition-all ${
              mode === m
                ? "bg-primary text-primary-foreground shadow-[0_0_24px_-6px] shadow-primary/60"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid gap-4 px-4 pb-4 sm:grid-cols-3 sm:px-6 sm:pb-6">
        <Field label="Altura (H)" value={h} onChange={setH} />
        {mode === "avance" ? (
          <Field label="Ancho (A)" value={a} onChange={setA} />
        ) : (
          <Field label="Perímetro (P)" value={perimetro} onChange={setPerimetro} />
        )}
        <Field label="Avance (L)" value={l} onChange={setL} />
        <div className="flex items-end gap-2 sm:col-span-1">
          <button
            onClick={reset}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-input bg-transparent font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <RotateCcw className="size-5" /> Limpiar
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="border-t-2 border-border bg-background/60 px-4 py-6 sm:px-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Resultados en tiempo real
        </p>
        {mode === "avance" ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <ResultCard label="Perímetro" value={fmt2(r.P)} unit="m" />
            <ResultCard label="Área" value={fmt2(r.area)} unit="m²" />
            <ResultCard label="Vol. contractual" value={fmt(r.vContract ?? 0)} unit="m³" highlight />
            <ResultCard label='Vol. real 1"' value={fmt(r.vReal1 ?? 0)} unit="m³" highlight />
            <ResultCard label='Vol. real 2"' value={fmt(r.vReal2 ?? 0)} unit="m³" highlight />
            <ResultCard label="Calibradores" value={`${r.calib}`} unit="und" highlight />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <ResultCard label="Perímetro" value={fmt2(r.P)} unit="m" />
            <ResultCard label="Área" value={fmt2(r.area)} unit="m²" />
            <ResultCard label="Vol. resane" value={fmt2(r.vResane ?? 0)} unit="m³" highlight />
            <ResultCard label="Calibradores" value={`${r.calib}`} unit="und" highlight />
          </div>
        )}

        {/* Verification table */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Unidad</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              <tr className="border-t border-border">
                <td className="px-4 py-2.5">Perímetro</td>
                <td className="px-4 py-2.5 text-right font-bold">{fmt2(r.P)}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">m</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5">Área</td>
                <td className="px-4 py-2.5 text-right font-bold">{fmt2(r.area)}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">m²</td>
              </tr>
              {mode === "avance" ? (
                <>
                  <tr className="border-t border-border bg-primary/5">
                    <td className="px-4 py-2.5">Volumen contractual</td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">{fmt(r.vContract ?? 0)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">m³</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2.5">Volumen real 1"</td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">{fmt(r.vReal1 ?? 0)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">m³</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="px-4 py-2.5">Volumen real 2"</td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">{fmt(r.vReal2 ?? 0)}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">m³</td>
                  </tr>
                </>
              ) : (
                <tr className="border-t border-border bg-primary/5">
                  <td className="px-4 py-2.5">Volumen de resane</td>
                  <td className="px-4 py-2.5 text-right font-bold text-primary">{fmt2(r.vResane ?? 0)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">m³</td>
                </tr>
              )}
              <tr className="border-t border-border bg-primary/5">
                <td className="px-4 py-2.5">Calibradores (gauge pins)</td>
                <td className="px-4 py-2.5 text-right font-bold text-primary">{r.calib}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">und</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={copyReport}
          disabled={!hasInput}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-xl font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? <Check className="size-5" /> : <ClipboardCopy className="size-5" />}
          {copied ? "¡Copiado!" : "Copiar reporte"}
        </button>
      </div>
    </div>
  );
}
