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

export interface ValidatedRow {
  rowNum: number;
  material: string;
  kg: number;
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
  periodMonth?: number;   // 1-12
  periodYear?: number;
  accepted: ValidatedRow[];
  rejected: RejectedRow[];
  catalogMaterials: string[];
  catalogClients: string[];
}

/** Normalize a material/client name: trim, collapse whitespace, strip non-breaking spaces */
function normalizeName(s: string): string {
  return s.replace(/[\u00A0\u2007\u202F]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

/** Parse an Excel serial date number to JS Date */
function excelDateToJS(val: any): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof val === "string") {
    // Try DD/MM/YYYY or YYYY-MM-DD
    const parts = val.split(/[\/\-\.]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(Number);
      // DD/MM/YYYY
      if (a <= 31 && b <= 12 && c >= 2000) {
        const d = new Date(c, b - 1, a);
        if (!isNaN(d.getTime())) return d;
      }
      // YYYY-MM-DD
      if (a >= 2000 && b <= 12 && c <= 31) {
        const d = new Date(a, b - 1, c);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  return null;
}

/**
 * Validate an uploaded xlsx file against the IRM template structure.
 * Reads valid MATERIAL and CLIENTE lists from the hidden "Catalogo" sheet.
 */
export function parseAndValidateTemplate(data: ArrayBuffer): TemplateParseResult {
  const wb = XLSX.read(data, { type: "array", cellDates: true });

  // 1. Verify required sheets exist
  const capturaSheet = wb.SheetNames.find(s => s.toUpperCase() === "CAPTURA");
  const catalogoSheet = wb.SheetNames.find(s => s.toUpperCase() === "CATALOGO");

  if (!capturaSheet) {
    return { valid: false, error: "No se encontró la hoja 'CAPTURA' en el archivo. Verifica que estás usando la plantilla oficial.", accepted: [], rejected: [], catalogMaterials: [], catalogClients: [] };
  }
  if (!catalogoSheet) {
    return { valid: false, error: "No se encontró la hoja 'Catalogo' en el archivo. Verifica que no fue eliminada de la plantilla.", accepted: [], rejected: [], catalogMaterials: [], catalogClients: [] };
  }

  // 2. Read catalog lists
  const catWs = wb.Sheets[catalogoSheet];
  const catRows: any[][] = XLSX.utils.sheet_to_json(catWs, { header: 1, defval: "" });

  const catalogMaterials: string[] = [];
  const catalogClients: string[] = [];
  const clientSet = new Set<string>();

  // Skip header row (row 1)
  for (let i = 1; i < catRows.length; i++) {
    const mat = String(catRows[i][0] ?? "").trim();
    const cli = String(catRows[i][1] ?? "").trim();
    if (mat) catalogMaterials.push(mat);
    if (cli && !clientSet.has(cli.toUpperCase())) {
      catalogClients.push(cli);
      clientSet.add(cli.toUpperCase());
    }
  }

  if (catalogMaterials.length === 0) {
    return { valid: false, error: "La hoja 'Catalogo' no contiene materiales válidos.", accepted: [], rejected: [], catalogMaterials, catalogClients };
  }

  // Material lookup map (normalized)
  const matLookup = new Map<string, string>();
  catalogMaterials.forEach(m => matLookup.set(normalizeName(m), m));

  // Client lookup map (normalized)
  const cliLookup = new Map<string, string>();
  catalogClients.forEach(c => cliLookup.set(normalizeName(c), c));

  // 3. Read period from CAPTURA G2 and H2
  const capWs = wb.Sheets[capturaSheet];
  const capRows: any[][] = XLSX.utils.sheet_to_json(capWs, { header: 1, defval: "" });

  const periodMonth = Number(capRows[1]?.[6]); // G2 (0-indexed col 6)
  const periodYear = Number(capRows[1]?.[7]);   // H2 (0-indexed col 7)

  if (!periodMonth || periodMonth < 1 || periodMonth > 12 || !periodYear || periodYear < 2000) {
    return { valid: false, error: `Período inválido en la plantilla: MES=${capRows[1]?.[6]}, AÑO=${capRows[1]?.[7]}. Actualiza G2 y H2 en la hoja CAPTURA.`, accepted: [], rejected: [], catalogMaterials, catalogClients };
  }

  // 4. Parse data rows (row 6+ = index 5+)
  const dataRows = capRows.slice(5);
  const accepted: ValidatedRow[] = [];
  const rejected: RejectedRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 6;

    const rawMat = String(row[0] ?? "").trim();
    const rawKg = row[1];
    const rawCli = String(row[2] ?? "").trim();
    const rawFecha = row[3];
    const rawNotas = String(row[4] ?? "").trim();

    // Skip TOTAL row
    if (rawMat.toUpperCase().includes("TOTAL")) continue;

    // Skip empty rows silently
    if (!rawMat && !rawKg && !rawCli && !rawFecha) continue;

    const errors: string[] = [];

    // Validate MATERIAL — match against template catalog by name;
    // if not found, pass through raw value for system catalog matching by code
    const matchedMat = matLookup.get(normalizeName(rawMat));
    if (!rawMat) {
      errors.push(`Material vacío`);
    }

    // Validate KG
    const materialForCheck = (matchedMat || rawMat).toUpperCase();
    const isBattery = materialForCheck === "BATERIAS";
    const kgNum = typeof rawKg === "number" ? rawKg : parseFloat(String(rawKg));
    if (isNaN(kgNum) || kgNum <= 0) {
      errors.push(`KG inválido: debe ser número positivo`);
    } else if (isBattery && !Number.isInteger(kgNum)) {
      errors.push(`BATERIAS debe capturarse en piezas enteras (Pzs), no decimales`);
    }

    // Validate CLIENTE
    const matchedCli = cliLookup.get(normalizeName(rawCli));
    if (!matchedCli) {
      errors.push(`Cliente no válido: ${rawCli || "(vacío)"}. Debe ser: ${catalogClients.join(", ")}`);
    }

    // Validate FECHA
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
    } else {
      accepted.push({
        rowNum,
        material: matchedMat || rawMat,  // Use catalog name if matched, otherwise raw value for code matching
        kg: kgNum,
        cliente: matchedCli!,
        fecha: parsedDate!,
        notas: rawNotas,
      });
    }
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

/**
 * Generate a rejection report as an xlsx Blob.
 */
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

  // Set column widths
  ws["!cols"] = [
    { wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 14 }, { wch: 30 }, { wch: 60 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Rechazados_${MONTHS_ES[periodMonth]}_${periodYear}`);

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
