import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  ClipboardCopy,
  RotateCcw,
  Check,
  AlertTriangle,
  Camera,
  ImagePlus,
  X,
} from "lucide-react";
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
const [photos, setPhotos] = useState<string[]>([]);

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

    if (mode === "avance" || mode === "malla") {
      a.forEach((value, index) => {
        const error = fieldError("a", value);
        if (error) list.push(`Ancho ${index + 1}: ${error}`);
      });
    }

    return list;
  }, [mode, h, a, l]);

  const inputsComplete =
  mode === "avance" || mode === "malla"
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
if (mode === "malla") {
  const P = ((2 * H) + A) * FARC_DEFAULT;
  const area = L * P;
  const vMalla = area / MALLA_RENDIMIENTO;

  return {
    P,
    area,
    vMalla,
  };
}
    const area = H * L;
const vResane = area / RESANE_RENDIMIENTO;
const filas = H < 1.9 ? 1 : Math.floor(H);
const calib = H <= 0 || L <= 0 ? 0 : filas * Math.ceil(Math.max(L - 1, 0));
const P = 2 * H;
return { P, area, vResane, calib, filas };
  }, [mode, h, a, l, espesor]);

  const shown = calculated && valid ? r : null;

const addPhotos = (files: FileList | null) => {
  if (!files) return;

  const selectedFiles = Array.from(files);

  selectedFiles.forEach((file) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      setPhotos((current) => [...current, reader.result as string]);
    };

    reader.readAsDataURL(file);
  });
};

const removePhoto = (index: number) => {
  setPhotos((current) => current.filter((_, i) => i !== index));
};

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
  setPhotos([]);
  toast.success("Campos limpiados");
};

const buildPDF = () => {
  if (!shown) {
    toast.error("Primero realiza el cálculo");
    return null;
  }

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const date = new Date().toLocaleDateString("es-PE");

  const safeLabor =
    labor.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "Sin_Labor";

  const fileName = `Reporte_Shotcrete_${safeLabor}_${date.replace(
    /\//g,
    "-"
  )}.pdf`;

  const fmtPDF = (value: number, decimals = 2) =>
    Number(value || 0).toFixed(decimals);

  // ─────────────────────────────────────────────
  // ENCABEZADO
  // ─────────────────────────────────────────────

  pdf.setFillColor(35, 35, 35);
  pdf.rect(0, 0, pageWidth, 30, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("UM CHUNGAR", margin, 12);

  pdf.setFontSize(11);
  pdf.text("CÁLCULO DE VOLUMEN DE SHOTCRETE", margin, 21);

  // ─────────────────────────────────────────────
  // DATOS GENERALES
  // ─────────────────────────────────────────────

  let y = 40;

  pdf.setTextColor(35, 35, 35);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);

  pdf.text("Fecha:", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(date, margin + 20, y);

  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.text("Nivel:", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(nivel || "—", margin + 20, y);

  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.text("Labor:", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(labor || "—", margin + 20, y);

  // ─────────────────────────────────────────────
  // DATOS DE LA LABOR
  // ─────────────────────────────────────────────

  y += 12;

  pdf.setFillColor(235, 235, 235);
  pdf.rect(margin, y, contentWidth, 8, "F");

  pdf.setTextColor(35, 35, 35);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("DATOS DE LA LABOR", margin + 4, y + 5.5);

  y += 15;

  pdf.setFontSize(9);

  const drawDataRow = (
    label: string,
    value: string,
    rowY: number
  ) => {
    pdf.setFont("helvetica", "bold");
    pdf.text(label, margin + 4, rowY);

    pdf.setFont("helvetica", "normal");
    pdf.text(value, margin + 55, rowY);
  };

  const modoTexto =
    mode === "avance"
      ? "AVANCE"
      : mode === "malla"
        ? "MALLA"
        : "RESANE";

  drawDataRow("Modo", modoTexto, y);
  y += 7;

  drawDataRow("Altura (H)", `${fmtPDF(Number(h))} m`, y);
  y += 7;

  if (mode !== "resane") {
    drawDataRow("Ancho (A)", `${fmtPDF(Number(a))} m`, y);
    y += 7;
  }

  drawDataRow("Avance (L)", `${fmtPDF(Number(l))} m`, y);
  y += 7;

  if (mode === "avance") {
    drawDataRow("Espesor", `${espesor}"`, y);
    y += 7;
  }

  // Línea separadora
  y += 3;

  pdf.setDrawColor(190, 190, 190);
  pdf.line(margin, y, pageWidth - margin, y);

  // ─────────────────────────────────────────────
  // RESULTADOS
  // ─────────────────────────────────────────────

  y += 10;

  pdf.setFillColor(235, 235, 235);
  pdf.rect(margin, y, contentWidth, 8, "F");

  pdf.setTextColor(35, 35, 35);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("RESULTADOS", margin + 4, y + 5.5);

  y += 14;

  // AVANCE
  if (mode === "avance") {
    const colWidth = contentWidth / 3;

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text("PERÍMETRO", margin + 2, y);
    pdf.text("ÁREA", margin + colWidth + 2, y);
    pdf.text(
      "V. CONTRATO",
      margin + colWidth * 2 + 2,
      y
    );

    y += 6;

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");

    pdf.text(
      `${fmtPDF(shown.P)} m`,
      margin + 2,
      y
    );

    pdf.text(
      `${fmtPDF(shown.area)} m²`,
      margin + colWidth + 2,
      y
    );

    pdf.text(
      `${fmtPDF(shown.vContract ?? 0)} m³`,
      margin + colWidth * 2 + 2,
      y
    );

    y += 14;

    // SACRIFICIO 1"
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 7, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("SACRIFICIO 1\"", margin + 3, y + 5);

    y += 13;

    const half = contentWidth / 2;

    pdf.setFontSize(8);
    pdf.text("SH", margin + 4, y);
    pdf.text("M³ LABOR", margin + half + 4, y);

    y += 6;

    pdf.setFontSize(11);

    pdf.text(
      `${fmtPDF(shown.sh1 ?? 0)} m³`,
      margin + 4,
      y
    );

    pdf.text(
      `${fmtPDF(shown.vReal1 ?? 0)} m³`,
      margin + half + 4,
      y
    );

    y += 13;

    // SACRIFICIO 2"
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 7, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("SACRIFICIO 2\"", margin + 3, y + 5);

    y += 13;

    pdf.setFontSize(8);
    pdf.text("SH", margin + 4, y);
    pdf.text("M³ LABOR", margin + half + 4, y);

    y += 6;

    pdf.setFontSize(11);

    pdf.text(
      `${fmtPDF(shown.sh2 ?? 0)} m³`,
      margin + 4,
      y
    );

    pdf.text(
      `${fmtPDF(shown.vReal2 ?? 0)} m³`,
      margin + half + 4,
      y
    );

    y += 15;

    // CALIBRADORES
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 7, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("CALIBRADORES", margin + 3, y + 5);

    y += 13;

    pdf.setFontSize(11);
    pdf.text(`${shown.calib ?? 0} und`, margin + 4, y);
  }

  // MALLA
  if (mode === "malla") {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text("PERÍMETRO", margin + 2, y);
    pdf.text("ÁREA", margin + contentWidth / 2 + 2, y);

    y += 6;

    pdf.setFontSize(11);

    pdf.text(
      `${fmtPDF(shown.P)} m`,
      margin + 2,
      y
    );

    pdf.text(
      `${fmtPDF(shown.area)} m²`,
      margin + contentWidth / 2 + 2,
      y
    );

    y += 14;

    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 7, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("VOLUMEN DE MALLA", margin + 3, y + 5);

    y += 13;

    pdf.setFontSize(13);
    pdf.text(
      `${fmtPDF(shown.vMalla ?? 0)} m³`,
      margin + 4,
      y
    );
  }

  // RESANE
  if (mode === "resane") {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");

    pdf.text("ÁREA", margin + 2, y);
    pdf.text(
      "VOLUMEN DE RESANE",
      margin + contentWidth / 2 + 2,
      y
    );

    y += 6;

    pdf.setFontSize(11);

    pdf.text(
      `${fmtPDF(shown.area)} m²`,
      margin + 2,
      y
    );

    pdf.text(
      `${fmtPDF(shown.vResane ?? 0)} m³`,
      margin + contentWidth / 2 + 2,
      y
    );

    y += 14;

    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 7, "F");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("CALIBRADORES", margin + 3, y + 5);

    y += 13;

    pdf.setFontSize(11);
    pdf.text(`${shown.calib ?? 0} und`, margin + 4, y);
  }

  // ─────────────────────────────────────────────
  // FOTOS
  // ─────────────────────────────────────────────

  if (photos.length > 0) {
    pdf.addPage();

    const drawPhotoHeader = () => {
      pdf.setFillColor(35, 35, 35);
      pdf.rect(0, 0, pageWidth, 24, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("EVIDENCIA FOTOGRÁFICA", margin, 15);
    };

    drawPhotoHeader();

    const photoWidth = 82;
    const photoHeight = 58;
    const gap = 10;
    const startY = 34;
    const rowHeight = 70;

    photos.forEach((photo, index) => {
      const position = index % 4;

      if (index > 0 && index % 4 === 0) {
        pdf.addPage();
        drawPhotoHeader();
      }

      const column = position % 2;
      const row = Math.floor(position / 2);

      const x =
        margin + column * (photoWidth + gap);

      const photoY =
        startY + row * rowHeight;

      pdf.setDrawColor(190, 190, 190);
      pdf.rect(
        x,
        photoY,
        photoWidth,
        photoHeight
      );

      try {
        const imageFormat = photo.startsWith("data:image/png")
          ? "PNG"
          : "JPEG";

        pdf.addImage(
          photo,
          imageFormat,
          x,
          photoY,
          photoWidth,
          photoHeight
        );
      } catch {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `No se pudo cargar la foto ${index + 1}`,
          x + 8,
          photoY + photoHeight / 2
        );
      }

      pdf.setFillColor(35, 35, 35);
      pdf.rect(
        x,
        photoY + photoHeight - 7,
        photoWidth,
        7,
        "F"
      );

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text(
        `FOTO ${index + 1}`,
        x + photoWidth / 2,
        photoY + photoHeight - 2.5,
        { align: "center" }
      );
    });
  }

  // ─────────────────────────────────────────────
  // PIE DE PÁGINA
  // ─────────────────────────────────────────────

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    pdf.setDrawColor(200, 200, 200);
    pdf.line(
      margin,
      pageHeight - 13,
      pageWidth - margin,
      pageHeight - 13
    );

    pdf.setTextColor(90, 90, 90);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);

    pdf.text(
      "UM CHUNGAR — Cálculo volumen de Shotcrete",
      margin,
      pageHeight - 7
    );

    pdf.text(
      `Página ${page} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: "right" }
    );
  }

  return { pdf, fileName, date };
};

const generatePDF = () => {
  const result = buildPDF();

  if (!result) return;

  result.pdf.save(result.fileName);

  toast.success("PDF generado correctamente");
};

const sharePDF = async () => {
  const result = buildPDF();

  if (!result) return;

  const { pdf, fileName, date } = result;

  const blob = pdf.output("blob");

  const file = new File([blob], fileName, {
    type: "application/pdf",
  });

  const shareText = `Cálculo volumen de Shotcrete

Nivel: ${nivel}
Labor: ${labor}
Fecha: ${date}`;

  try {
    if (
      navigator.share &&
      navigator.canShare?.({ files: [file] })
    ) {
      await navigator.share({
        title: "Cálculo volumen de Shotcrete",
        text: shareText,
        files: [file],
      });

      return;
    }

    toast.error(
      "Este dispositivo no permite compartir el PDF directamente"
    );
  } catch (error) {
    if ((error as DOMException)?.name === "AbortError") {
      return;
    }

    toast.error("No se pudo compartir el PDF");
  }
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
        : mode === "malla"
          ? [
              "REPORTE SHOTCRETE — MODO MALLA",
              `Labor: ${labor}`,
              `Nivel: ${nivel}`,
              `H: ${h} m | A: ${a} m | L: ${l} m`,
              `Perímetro: ${fmt2(shown.P)} m`,
              `Área: ${fmt2(shown.area)} m²`,
              `Volumen de malla: ${fmt(shown.vMalla ?? 0, 2)} m³`,
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

                {mode === "avance" || mode === "malla" ? (
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
{mode === "avance" && (
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
)}

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
                                        ) : mode === "malla" ? (
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
                label="Vol. Malla"
                value={fmt(shown.vMalla, 2)}
                unit="m³"
                highlight
              />
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
        <td className="px-4 py-2.5">
          Perímetro
        </td>
        <td className="px-4 py-2.5 text-right font-bold">
          {fmt2(shown.P)}
        </td>
        <td className="px-4 py-2.5 text-right text-muted-foreground">
          m
        </td>
      </tr>

      <tr className="border-t border-border">
        <td className="px-4 py-2.5">
          Área
        </td>
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
        </>
      ) : mode === "malla" ? (
        <tr className="border-t border-border bg-primary/5">
          <td className="px-4 py-2.5">
            Volumen de malla (Área / 21)
          </td>
          <td className="px-4 py-2.5 text-right font-bold text-primary">
            {fmt(shown.vMalla, 2)}
          </td>
          <td className="px-4 py-2.5 text-right text-muted-foreground">
            m³
          </td>
        </tr>
      ) : (
        <>
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
        </>
      )}
    </tbody>
  </table>
</div>

{/* Evidencia fotográfica */}
<div className="mt-6 border-t border-border pt-6">
  <div className="mb-3">
    <p className="text-sm font-extrabold uppercase tracking-widest text-foreground">
      EVIDENCIA FOTOGRÁFICA
    </p>

    <p className="mt-1 text-xs text-muted-foreground">
      Agrega fotografías de la labor para incluirlas en el PDF.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold uppercase text-primary-foreground">
      <Camera className="size-5" />
      Tomar foto

      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addPhotos(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </label>

    <label className="flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-input bg-secondary px-3 text-sm font-bold uppercase text-foreground">
      <ImagePlus className="size-5" />
      Galería

      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addPhotos(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </label>
  </div>

  {photos.length > 0 && (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={index}
          className="relative overflow-hidden rounded-lg border-2 border-border bg-secondary"
        >
          <img
            src={photo}
            alt={`Evidencia ${index + 1}`}
            className="aspect-square w-full object-cover"
          />

          <button
            type="button"
            onClick={() => removePhoto(index)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
            aria-label={`Eliminar foto ${index + 1}`}
          >
            <X className="size-4" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-center text-xs font-bold text-white">
            Foto {index + 1}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

<button
  onClick={generatePDF}
  className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary/10 font-display text-xl font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20"
>
  Descargar PDF
</button>

<button
  onClick={sharePDF}
  className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-primary bg-primary font-display text-xl font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110"
>
  Compartir PDF
</button>

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
