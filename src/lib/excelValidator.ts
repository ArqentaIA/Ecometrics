import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────
// Excel Template Validator for Ecometrics IRM
// Validates by internal structure (Catalogo + CAPTURA sheets),
// NOT by filename.
// ─────────────────────────────────────────────────────────

const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const HEADER_ALIASES = {
  material: ["MATERIAL"],
  kg: ["KG", "KGS", "TOTAL KG / UNID.", "TOTAL KG/UNID.", "TOTAL KG", "TOTAL KG / UNIDAD"],
  cliente: ["CLIENTE"],
  fecha: ["FECHA"],
  notas: ["NOTAS", "OBSERVACIONES"],
  precio: ["PRECIO", "PRECIO PROM.", "PRECIO PROM", "PRECIO PROMEDIO"],
  importePagado: ["IMPORTE PAGADO", "IMPORTE", "TOTAL PAGADO", "IMPORTE TOTAL"],
} as const;

export interface ValidatedRow {
  rowNum: number;
  material: string;
  kg: number;
  precio: number | null;
  importePagado: number | null;
  cliente: string;
  fecha: Date;
  notas: string;
}

export interface RejectedRow {
  rowNum: number;
  material: string;
  kg: string;
  cliente: string;
  fecha: string;
  notas: string;
  reason: string;
}

export interface TemplateParseResult {
  valid: boolean;
  error?: string;
  periodMonth?: number;
  periodYear?: number;
  accepted: ValidatedRow[];
  rejected: RejectedRow[];
  catalogMaterials: string[];
  catalogClients: string[];
}

function normalizeName(s: string): string {
  return s.replace(/[\u00A0\u2007\u202F]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function parseNumericCell(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (val == null || val === "") return null;

  const cleaned = String(val)
    .replace(/[$\s]/g, "")
    .replace(/,/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function excelDateToJS(val: unknown): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === "string") {
    const parts = val.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      if (a <= 31 && b <= 12 && c >= 2000) {
        const d = new Date(c, b - 1, a);
        if (!isNaN(d.getTime())) return d;
      }
      if (a >= 2000 && b <= 12 && c <= 31) {
        const d = new Date(a, b - 1, c);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  return null;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const found = rows[i]?.some(cell => normalizeName(String(cell ?? "")) === "MATERIAL");
    if (found) return i;
  }
  return -1;
}

function findColumnIndex(headerRow: unknown[], aliases: readonly string[], fallback: number): number {
  const normalizedAliases = aliases.map(normalizeName);
  const idx = headerRow.findIndex(cell => normalizedAliases.includes(normalizeName(String(cell ?? ""))));
  return idx >= 0 ? idx : fallback;
}

function uniqueIndices(indices: Array<number | undefined>): number[] {
  return Array.from(new Set(indices.filter((value): value is number => typeof value === "number" && value >= 0)));
}

export function parseAndValidateTemplate(data: ArrayBuffer): TemplateParseResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true });

  const capturaSheet = wb.SheetNames.find(s => s.toUpperCase() === "CAPTURA");
  const catalogoSheet = wb.SheetNames.find(s => s.toUpperCase() === "CATALOGO");

  if (!capturaSheet) {
    return {
      valid: false,
      error: "No se encontró la hoja 'CAPTURA' en el archivo. Verifica que estás usando la plantilla oficial.",
      accepted: [],
      rejected: [],
      catalogMaterials: [],
      catalogClients: [],
    };
  }

  const catalogMaterials: string[] = [];
  const catalogClients: string[] = [];

  if (catalogoSheet) {
    const catWs = wb.Sheets[catalogoSheet];
    const catRows: unknown[][] = XLSX.utils.sheet_to_json(catWs, { header: 1, defval: "" });
    const clientSet = new Set<string>();

    for (let i = 1; i < catRows.length; i++) {
      const mat = String(catRows[i][0] ?? "").trim();
      const cli = String(catRows[i][1] ?? "").trim();
      if (mat) catalogMaterials.push(mat);
      if (cli && !clientSet.has(cli.toUpperCase())) {
        catalogClients.push(cli);
        clientSet.add(cli.toUpperCase());
      }
    }
  }

  const hasCatalogSheet = catalogMaterials.length > 0;
  const matLookup = new Map<string, string>();
  catalogMaterials.forEach(m => matLookup.set(normalizeName(m), m));

  const cliLookup = new Map<string, string>();
  catalogClients.forEach(c => cliLookup.set(normalizeName(c), c));

  const capWs = wb.Sheets[capturaSheet];
  const capRows: unknown[][] = XLSX.utils.sheet_to_json(capWs, { header: 1, defval: "" });

  let periodMonth = Number(capRows[1]?.[6]) || 0;
  let periodYear = Number(capRows[1]?.[7]) || 0;

  const headerRowIdx = findHeaderRow(capRows);
  const dataStartIdx = headerRowIdx >= 0 ? headerRowIdx + 1 : 5;
  const headerRow = headerRowIdx >= 0 ? capRows[headerRowIdx] : [];

  const colIndexes = {
    material: findColumnIndex(headerRow, HEADER_ALIASES.material, 0),
    kg: findColumnIndex(headerRow, HEADER_ALIASES.kg, 1),
    cliente: findColumnIndex(headerRow, HEADER_ALIASES.cliente, 2),
    fecha: findColumnIndex(headerRow, HEADER_ALIASES.fecha, 3),
    notas: findColumnIndex(headerRow, HEADER_ALIASES.notas, 4),
    precio: findColumnIndex(headerRow, HEADER_ALIASES.precio, 5),
    importePagado: findColumnIndex(headerRow, HEADER_ALIASES.importePagado, 6),
  };

  const dateCandidates = uniqueIndices([colIndexes.fecha, 3, 6, 7]);

  if (!periodMonth || periodMonth < 1 || periodMonth > 12 || !periodYear || periodYear < 2000) {
    for (let i = dataStartIdx; i < capRows.length; i++) {
      for (const colIdx of dateCandidates) {
        const d = excelDateToJS(capRows[i]?.[colIdx]);
        if (d) {
          periodMonth = d.getMonth() + 1;
          periodYear = d.getFullYear();
          break;
        }
      }
      if (periodMonth > 0 && periodYear >= 2000) break;
    }
  }

  if (!periodMonth || periodMonth < 1 || periodMonth > 12 || !periodYear || periodYear < 2000) {
    return {
      valid: false,
      error: "No se pudo determinar el período. Incluye fechas válidas o configura G2 (mes) y H2 (año) en la hoja CAPTURA.",
      accepted: [],
      rejected: [],
      catalogMaterials,
      catalogClients,
    };
  }

  const dataRows = capRows.slice(dataStartIdx);
  const accepted: ValidatedRow[] = [];
  const rejected: RejectedRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = dataStartIdx + i + 1;

    const rawMat = String(row[colIndexes.material] ?? "").trim();
    const rawCli = String(row[colIndexes.cliente] ?? "").trim();
    const rawNotas = String(row[colIndexes.notas] ?? row[4] ?? row[7] ?? "").trim();
    const rawKg = row[colIndexes.kg];
    const rawPrecio = row[colIndexes.precio];
    const rawImportePagado = row[colIndexes.importePagado];

    let rawFecha: unknown = undefined;
    for (const colIdx of dateCandidates) {
      const candidate = row[colIdx];
      if (excelDateToJS(candidate)) {
        rawFecha = candidate;
        break;
      }
      if (rawFecha === undefined && candidate) rawFecha = candidate;
    }

    if (rawMat.toUpperCase().includes("TOTAL")) continue;
    if (!rawMat && !rawKg && !rawCli && !rawFecha && !rawPrecio && !rawImportePagado) continue;

    const errors: string[] = [];

    const matchedMat = hasCatalogSheet ? matLookup.get(normalizeName(rawMat)) : undefined;
    if (!rawMat) errors.push("Material vacío");
    if (!rawCli) errors.push("Cliente vacío");

    const materialForCheck = (matchedMat || rawMat).toUpperCase();
    const isBattery = materialForCheck === "BATERIAS";
    const kgNum = parseNumericCell(rawKg);

    if (kgNum == null || kgNum <= 0) {
      errors.push("KG inválido: debe ser número positivo");
    } else if (isBattery && !Number.isInteger(kgNum)) {
      errors.push("BATERIAS debe capturarse en piezas enteras (Pzs), no decimales");
    }

    const matchedCli = hasCatalogSheet ? cliLookup.get(normalizeName(rawCli)) : (rawCli || null);
    if (hasCatalogSheet && !matchedCli) {
      errors.push(`Cliente no válido: ${rawCli || "(vacío)"}. Debe ser: ${catalogClients.join(", ")}`);
    }

    const parsedDate = excelDateToJS(rawFecha);
    if (!parsedDate) {
      errors.push(`Fecha inválida: ${rawFecha || "(vacío)"}`);
    } else if (parsedDate.getMonth() + 1 !== periodMonth || parsedDate.getFullYear() !== periodYear) {
      errors.push(`Fecha fuera del período: se esperaba ${MONTHS_ES[periodMonth]} ${periodYear}`);
    }

    if (errors.length > 0) {
      rejected.push({
        rowNum,
        material: rawMat,
        kg: String(rawKg ?? ""),
        cliente: rawCli,
        fecha: rawFecha instanceof Date ? rawFecha.toLocaleDateString("es-MX") : String(rawFecha ?? ""),
        notas: rawNotas,
        reason: errors.join("; "),
      });
      continue;
    }

    const precioNum = parseNumericCell(rawPrecio);
    const importePagadoNum = parseNumericCell(rawImportePagado);

    accepted.push({
      rowNum,
      material: matchedMat || rawMat,
      kg: kgNum!,
      precio: precioNum != null && precioNum > 0 ? precioNum : null,
      importePagado: importePagadoNum != null && importePagadoNum > 0 ? importePagadoNum : null,
      cliente: matchedCli || rawCli,
      fecha: parsedDate!,
      notas: rawNotas,
    });
  }

  return {
    valid: true,
    periodMonth,
    periodYear,
    accepted,
    rejected,
    catalogMaterials,
    catalogClients,
  };
}

export function generateRejectionReport(
  rejected: RejectedRow[],
  periodMonth: number,
  periodYear: number
): Blob {
  const wb = XLSX.utils.book_new();

  const header = ["FILA", "MATERIAL", "KG", "CLIENTE", "FECHA", "NOTAS", "MOTIVO_RECHAZO"];
  const rows = rejected.map(r => [
    r.rowNum, r.material, r.kg, r.cliente, r.fecha, r.notas, r.reason,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  ws["!cols"] = [
    { wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 14 }, { wch: 30 }, { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Rechazados_${MONTHS_ES[periodMonth]}_${periodYear}`);

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
