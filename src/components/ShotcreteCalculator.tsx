import { useMemo, useState } from "react";
import { ClipboardCopy, RotateCcw, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ---- Constantes de cálculo (ajustables según contrato) ----
const R_REBOTE = 1.10;
const R_RUGOSIDAD = 1.16;
const FARC_DEFAULT = 0.90;

const ESPESOR_SH_1_M = 0.0254;
const ESPESOR_SH_2_M = 0.0508;
const PULGADA_A_METROS = 0.0254;
const SOBREESPESOR_CONTRACTUAL = 0.2;

const RESANE_RENDIMIENTO = 11.5;
const MALLA_RENDIMIENTO = 21;

// Rangos razonables para labores subterráneas
const RANGES = {
  h: { min: 0.5, max: 15, label: "Altura (H)" },
  a: { min: 0.5, max: 20, label: "Ancho (A)" },
  l: { min: 0.1, max: 50, label: "Avance (L)" },
  p: { min: 1, max: 60, label: "Perímetro (P)" },
} as const;

type Mode = "avance" | "resane" | "malla";
type FieldKey = keyof typeof RANGES;

function parse(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function average(values: string[]): number {
  const numbers = values
    .map(parse)
    .filter((value) => value > 0);

  if (numbers.length === 0) return 0;

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

const fmt = (n: number, d = 1) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt2 = (n: number) => fmt(n, 1);

function fieldError(key: FieldKey, raw: string): string | null {
  if (raw.trim() === "") return null; // vacío: sin error inline, simplemente no hay cálculo
  const v = parse(raw);
  const { min, max, label } = RANGES[key];
  if (!(v > 0)) return `${label} debe ser mayor que 0`;
  if (v < min || v > max) return `${label}: rango permitido ${min} – ${max} m`;
  return null;
}

interface FieldProps {
  fieldKey: FieldKey;
  value: string;
  onChange: (v: string) => void;
}

function Field({ fieldKey, value, onChange }: FieldProps) {
  const error = fieldError(fieldKey, value);

  return (
    <label className="block">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        placeholder="0.00"
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={`h-16 w-full rounded-lg border-2 bg-secondary px-4 text-3xl font-bold tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 ${
          error ? "border-destructive" : "border-input focus:border-primary"
        }`}
      />

      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" /> {error}
        </span>
      )}
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
      className={`rounded-xl border-2 p-3 sm:p-5 ${
        highlight ? "border-primary bg-primary/10" : "border-border bg-secondary"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 font-display text-3xl font-bold tabular-nums leading-none sm:text-5xl">
        <span className={highlight ? "text-primary" : "text-foreground"}>
          {value}
        </span>{" "}
        <span className="text-lg font-semibold text-muted-foreground">
          {unit}
        </span>
      </p>
    </div>
  );
}

export function ShotcreteCalculator() {
  const [mode, setMode] = useState<Mode>("avance");
  const [h, setH] = useState<string[]>([""]);
const [a, setA] = useState<string[]>([""]);
const [l, setL] = useState<string[]>([""]);
const [labor, setLabor] = useState("");
const [nivel, setNivel] = useState("");
const [espesor, setEspesor] = useState("2");
const [copied, setCopied] = useState(false);
const [calculated, setCalculated] = useState(false);

    const errors = useMemo(() => {
    const list: string[] = [];

    h.forEach((value, index) => {
      const error = fieldError("h", value);
      if (error) list.push(`Altura ${index + 1}: ${error}`);
    });

    l.forEach((value, index) => {
      const error = fieldError("l", value);
      if (error) list.push(`Avance ${index + 1}: ${error}`);
    });

    if (mode === "avance") {
      a.forEach((value, index) => {
        const error = fieldError("a", value);
        if (error) list.push(`Ancho ${index + 1}: ${error}`);
      });
    }

    return list;
  }, [mode, h, a, l]);

  const inputsComplete =
    mode === "avance"
      ? h.some((value) => value.trim() !== "") &&
        a.some((value) => value.trim() !== "") &&
        l.some((value) => value.trim() !== "")
      : h.some((value) => value.trim() !== "") &&
        l.some((value) => value.trim() !== "");

  const espesorValido = mode !== "avance" || parse(espesor) > 0;

const valid = inputsComplete && errors.length === 0 && espesorValido;

  const r = useMemo(() => {
    const H = average(h);
const A = average(a);
const L = average(l);
    if (mode === "avance") {
      const P = 2 * H + A;
      const area = P * L;
      const espesorM = parse(espesor) * PULGADA_A_METROS;

const vBase =
  R_REBOTE *
  R_RUGOSIDAD *
  espesorM *
  L *
  P *
  FARC_DEFAULT;

const vContract = area > 0 ? vBase + SOBREESPESOR_CONTRACTUAL : 0;

const longitudSacrificio = 2 * (H - 1.5) + 2 * A;

const sh1 =
  longitudSacrificio *
  R_REBOTE *
  R_RUGOSIDAD *
  FARC_DEFAULT *
  ESPESOR_SH_1_M;

const sh2 =
  longitudSacrificio *
  R_REBOTE *
  R_RUGOSIDAD *
  FARC_DEFAULT *
  ESPESOR_SH_2_M;

const vReal1 = vBase + sh1;
const vReal2 = vBase + sh2;
      const calib =
  H <= 0
    ? 0
    : H > 4.2
      ? Math.round((H - 1) * 2 * 2)
      : Math.ceil(P * FARC_DEFAULT - 1) * 2;
      return { P, area, vBase, vContract, sh1, sh2, vReal1, vReal2, calib };
    }
    const area = H * L;
const vResane = area / RESANE_RENDIMIENTO;
const filas = H < 1.9 ? 1 : Math.floor(H);
const calib = H <= 0 || L <= 0 ? 0 : filas * Math.ceil(Math.max(L - 1, 0));
const P = 2 * H;
return { P, area, vResane, calib, filas };
  }, [mode, h, a, l, espesor]);

  const shown = calculated && valid ? r : null;

  const calculate = () => {
  if (!valid) {
    toast.error("Ingresa valores válidos para calcular");
    return;
  }
  setCalculated(true);
};

const addMeasurement = (
  setter: React.Dispatch<React.SetStateAction<string[]>>
) => {
  setter((values) => [...values, ""]);
};

const removeMeasurement = (
  setter: React.Dispatch<React.SetStateAction<string[]>>,
  index: number
) => {
  setter((values) => {
    if (values.length === 1) return values;
    return values.filter((_, i) => i !== index);
  });
};

const reset = () => {
  setH([""]);
  setA([""]);
  setL([""]);
  setLabor("");
  setNivel("");
  setEspesor("2");
  setCalculated(false);
  toast.success("Campos limpiados");
};

  const copyReport = async () => {
    if (!shown) return;
    const lines =
      mode === "avance"
        ? [
            "REPORTE SHOTCRETE — MODO AVANCE",
`Labor: ${labor}`,
`Nivel: ${nivel}`,
`H: ${h} m | A: ${a} m | L: ${l} m`,
`Espesor: ${espesor}"`,
`Perímetro: ${fmt2(shown.P)} m`,
            `Área: ${fmt2(shown.area)} m²`,
            `Volumen contractual: ${fmt(shown.vContract ?? 0)} m³`,
            `Volumen real 1": ${fmt(shown.vReal1 ?? 0)} m³`,
            `Volumen real 2": ${fmt(shown.vReal2 ?? 0)} m³`,
            `Calibradores: ${shown.calib} und`,
          ]
        : [
            "REPORTE SHOTCRETE — MODO RESANE",
`Labor: ${labor}`,
`Nivel: ${nivel}`,
`H: ${h} m | L: ${l} m`,
            `Área: ${fmt2(shown.area)} m²`,
            `Volumen de resane: ${fmt2(shown.vResane ?? 0)} m³`,
            `Calibradores: ${shown.calib} und`,
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
      <div className="grid grid-cols-3 gap-2 p-4 sm:p-6">
        {(["avance", "resane", "malla"] as Mode[]).map((m) => (
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
<div className="px-4 pb-2 sm:px-6">
  <div className="grid grid-cols-2 gap-3 pt-3 pb-4">
  <div>
    <label className="mb-1 block text-sm font-extrabold uppercase tracking-wide text-foreground">
      Nivel
    </label>
    <input
      type="text"
      value={nivel}
      onChange={(e) => setNivel(e.target.value)}
      placeholder="Ingrese nivel"
      className="h-12 w-full rounded-lg border-2 border-input bg-secondary px-3 text-base font-semibold text-foreground outline-none focus:border-primary"
    />
  </div>

  <div>
    <label className="mb-1 block text-sm font-extrabold uppercase tracking-wide text-foreground">
      Labor
    </label>
    <input
      type="text"
      value={labor}
      onChange={(e) => setLabor(e.target.value)}
      placeholder="Ingrese labor"
      className="h-12 w-full rounded-lg border-2 border-input bg-secondary px-3 text-base font-semibold text-foreground outline-none focus:border-primary"
    />
  </div>
</div>
</div>
<div>
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm font-extrabold uppercase tracking-widest text-foreground">
  ALTURA (H) <span className="text-steel">(m)</span>
</span>

    <button
      type="button"
      onClick={() => addMeasurement(setH)}
      className="flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"
    >
      + Agregar medición
    </button>
  </div>

  <div className="space-y-3">
    {h.map((value, index) => (
      <div key={index}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            ALTURA {index + 1} (H{index + 1})
          </span>

          {h.length > 1 && (
            <button
              type="button"
              onClick={() => removeMeasurement(setH, index)}
              className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-input text-lg font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
              aria-label={`Eliminar H${index + 1}`}
            >
              −
            </button>
          )}
        </div>

        <Field
          fieldKey="h"
          value={value}
          onChange={(v) =>
            setH((values) =>
              values.map((item, i) => (i === index ? v : item))
            )
          }
        />
      </div>
    ))}
  </div>

  <p className="mt-2 text-xs font-bold text-muted-foreground">
    Promedio H: {average(h).toFixed(2)} m
  </p>
</div>

                {mode === "avance" ? (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-extrabold uppercase tracking-widest text-foreground">
  ANCHO (A) <span className="text-steel">(m)</span>
</span>

      <button
        type="button"
        onClick={() => addMeasurement(setA)}
        className="flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"
      >
        + Agregar medición
      </button>
    </div>

    <div className="space-y-3">
      {a.map((value, index) => (
        <div key={index}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              ANCHO {index + 1} (A{index + 1})
            </span>

            {a.length > 1 && (
              <button
                type="button"
                onClick={() => removeMeasurement(setA, index)}
                className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-input text-lg font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                aria-label={`Eliminar A${index + 1}`}
              >
                −
              </button>
            )}
          </div>

          <Field
            fieldKey="a"
            value={value}
            onChange={(v) =>
              setA((values) =>
                values.map((item, i) => (i === index ? v : item))
              )
            }
          />
        </div>
      ))}
    </div>

    <p className="mt-2 text-xs font-bold text-muted-foreground">
      Promedio A: {average(a).toFixed(2)} m
    </p>
  </div>
) : (
  <div />
)}

        <div>
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm font-extrabold uppercase tracking-widest text-foreground">
  AVANCE (L) <span className="text-steel">(m)</span>
</span>

    <button
      type="button"
      onClick={() => addMeasurement(setL)}
      className="flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"
    >
      + Agregar medición
    </button>
  </div>

  <div className="space-y-3">
    {l.map((value, index) => (
      <div key={index}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            AVANCE {index + 1} (L{index + 1})
          </span>

          {l.length > 1 && (
            <button
              type="button"
              onClick={() => removeMeasurement(setL, index)}
              className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-input text-lg font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
              aria-label={`Eliminar L${index + 1}`}
            >
              −
            </button>
          )}
        </div>

        <Field
          fieldKey="l"
          value={value}
          onChange={(v) =>
            setL((values) =>
              values.map((item, i) => (i === index ? v : item))
            )
          }
        />
      </div>
    ))}
  </div>

  <p className="mt-2 text-xs font-bold text-muted-foreground">
    Promedio L: {average(l).toFixed(2)} m
  </p>
</div>
<div className="px-4 pb-4 pt-2 sm:px-6">
  <label className="mb-2 block text-sm font-extrabold uppercase tracking-widest text-foreground">
    ESPESOR <span className="text-steel">(pulg)</span>
  </label>

  <input
    type="number"
    inputMode="decimal"
    min="0"
    step="0.1"
    value={espesor}
    onChange={(e) => setEspesor(e.target.value)}
    className="h-14 w-full rounded-lg border-2 border-input bg-secondary px-4 text-2xl font-bold tabular-nums text-foreground outline-none focus:border-primary"
  />
</div>

<div className="flex flex-col gap-3 px-4 pb-4 pt-2 sm:flex-row sm:px-6 sm:pb-6">
  <button
    onClick={calculate}
    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:brightness-110 sm:w-auto sm:px-8"
  >
    CALCULAR
  </button>

  <button
    onClick={reset}
    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-input bg-transparent font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:border-destructive hover:text-destructive sm:w-auto sm:px-8"
  >
    <RotateCcw className="size-5" /> LIMPIAR
  </button>
</div>

            {/* Results */}
      {shown && (
        <div className="border-t-2 border-border bg-background/60 px-4 py-6 sm:px-6">
          <div className="mb-5 border-b-2 border-primary/30 pb-3">
  <p className="text-lg font-bold uppercase tracking-[0.25em] text-primary">
    Resultados
  </p>
</div>
          {mode === "avance" ? (
            <div className="space-y-4">
  {/* Fila 1: datos generales */}
  <div className="grid grid-cols-3 gap-2">
    <ResultCard
      label="Perímetro"
      value={fmt2(shown.P)}
      unit="m"
    />
    <ResultCard
      label="Área"
      value={fmt2(shown.area)}
      unit="m²"
    />
    <ResultCard
      label="Vol. Contractual"
      value={fmt(shown.vContract)}
      unit="m³"
    />
  </div>

  {/* Cálculo Shotcrete — Sacrificio 1" */}
<p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
  Cálculo Shotcrete — Sacrificio 1"
</p>

<div className="grid grid-cols-2 gap-2">
  <ResultCard
    label='SH SACRIFICIO 1"'
    value={fmt(shown.sh1)}
    unit="m³"
    highlight
  />
  <ResultCard
    label="M³ Labor"
    value={fmt(shown.vReal1)}
    unit="m³"
    highlight
  />
</div>

  {/* Cálculo Shotcrete — Sacrificio 2" */}
<p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
  Cálculo Shotcrete — Sacrificio 2"
</p>

<div className="grid grid-cols-2 gap-2">
  <ResultCard
    label='SH SACRIFICIO 2"'
    value={fmt(shown.sh2)}
    unit="m³"
    highlight
  />
  <ResultCard
    label="M³ Labor"
    value={fmt(shown.vReal2)}
    unit="m³"
    highlight
  />
</div>

  {/* Calibradores */}
<p className="pt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
  Calibradores
</p>

<div className="grid grid-cols-2 gap-2">
  <ResultCard
    label="Calibradores"
    value={`${shown.calib}`}
    unit="und"
    highlight
  />
</div>
</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <ResultCard
                label="Perímetro"
                value={fmt2(shown.P)}
                unit="m"
              />
              <ResultCard
                label="Área"
                value={fmt2(shown.area)}
                unit="m²"
              />
              <ResultCard
                label="Vol. resane"
                value={fmt2(shown.vResane)}
                unit="m³"
                highlight
              />
              <ResultCard
                label="Calibradores"
                value={`${shown.calib}`}
                unit="und"
                highlight
              />
            </div>
          )}
          {mode === "avance" && (
            <p className="mt-3 text-xs text-muted-foreground">
  Desglose: V_base = Rb × R × e × L × P × Fc ={" "}
  {fmt(shown.vBase)} m³ · e = {espesor}" · Contrato = V_base +{" "}
  {SOBREESPESOR_CONTRACTUAL.toFixed(2)} m³ · SH 1" ={" "}
  {fmt(shown.sh1)} m³ · SH 2" = {fmt(shown.sh2)} m³
</p>
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
                  <td className="px-4 py-2.5 text-right font-bold">
                    {fmt2(shown.P)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    m
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2.5">Área</td>
                  <td className="px-4 py-2.5 text-right font-bold">
                    {fmt2(shown.area)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    m²
                  </td>
                </tr>
                {mode === "avance" ? (
                  <>
                    <tr className="border-t border-border bg-primary/5">
                      <td className="px-4 py-2.5">
                        Volumen contractual
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {fmt(shown.vContract)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        m³
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2.5">
                        SH SACRIFICIO 1"
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {fmt(shown.sh1)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        m³
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2.5">
                        M³ Labor 1
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {fmt(shown.vReal1)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        m³
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2.5">
                        SH SACRIFICIO 2"
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {fmt(shown.sh2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        m³
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-2.5">
                        M³ Labor 2
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {fmt(shown.vReal2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        m³
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr className="border-t border-border bg-primary/5">
                    <td className="px-4 py-2.5">
                      Volumen de resane (Área / 11.5)
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-primary">
                      {fmt2(shown.vResane)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      m³
                    </td>
                  </tr>
                )}
                <tr className="border-t border-border bg-primary/5">
                  <td className="px-4 py-2.5">
                    Calibradores
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-primary">
                    {shown.calib}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    und
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            onClick={copyReport}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary font-display text-xl font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110"
          >
            {copied ? (
              <Check className="size-5" />
            ) : (
              <ClipboardCopy className="size-5" />
            )}
            {copied ? "¡Copiado!" : "Copiar reporte"}
          </button>
                </div>
      )}
    </div>
  );
}
