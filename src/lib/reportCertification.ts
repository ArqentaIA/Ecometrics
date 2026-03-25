/**
 * Módulo de certificación digital para reportes ECOMETRICS.
 * Genera folio, hash SHA-256, firma digital y dataset ID.
 */

/** Genera folio único: ECM-YYYYMMDD-HHMMSS-XXXX */
export function generateFolio(date: Date = new Date()): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `ECM-${datePart}-${timePart}-${suffix}`;
}

/** Genera dataset ID: DATASET-YYYYMMDD-XXXX */
export function generateDatasetId(date: Date = new Date()): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `DATASET-${datePart}-${suffix}`;
}

/** Construye payload canónico para hash */
function buildHashPayload(params: {
  folio: string;
  tipoReporte: string;
  parametros: Record<string, unknown>;
  datasetRows: Array<Record<string, unknown>>;
  timestamp: string;
}): string {
  // Deterministic JSON: sort keys
  return JSON.stringify({
    folio: params.folio,
    tipo: params.tipoReporte,
    parametros: params.parametros,
    dataset: params.datasetRows,
    timestamp: params.timestamp,
  }, Object.keys({
    folio: 1, tipo: 1, parametros: 1, dataset: 1, timestamp: 1,
  }));
}

/** SHA-256 hash using Web Crypto API */
export async function computeSHA256(params: {
  folio: string;
  tipoReporte: string;
  parametros: Record<string, unknown>;
  datasetRows: Array<Record<string, unknown>>;
  timestamp: string;
}): Promise<string> {
  const payload = buildHashPayload(params);
  const encoded = new TextEncoder().encode(payload);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Firma digital derivada: primeros 16 chars del hash + sufijo del folio */
export function deriveSignature(hash: string, folio: string): string {
  const hashPrefix = hash.substring(0, 16).toUpperCase();
  const folioSuffix = folio.split("-").pop() ?? "XXXX";
  return `${hashPrefix}-${folioSuffix}`;
}

/** Abrevia hash para mostrar en reporte */
export function abbreviateHash(hash: string, length = 20): string {
  return hash.substring(0, length).toUpperCase();
}

/** URL de verificación */
export function getVerificationUrl(folio: string): string {
  return `${window.location.origin}/verificar?folio=${encodeURIComponent(folio)}`;
}

/** Construye dataset rows canónico desde confirmedEntries para hash */
export function buildCanonicalDataset(
  entries: Array<{
    material: { code: string; name: string; family: string };
    kg: number;
    kpis: { kg_netos: number; economic_impact: number; co2: number; energia: number; agua: number; arboles: number };
  }>
): Array<Record<string, unknown>> {
  return entries.map(e => ({
    code: e.material.code,
    kg: Number(e.kg.toFixed(4)),
    kg_netos: Number(e.kpis.kg_netos.toFixed(4)),
    economic_impact: Number(e.kpis.economic_impact.toFixed(4)),
    co2: Number(e.kpis.co2.toFixed(4)),
    energia: Number(e.kpis.energia.toFixed(4)),
    agua: Number(e.kpis.agua.toFixed(4)),
    arboles: Number(e.kpis.arboles.toFixed(4)),
  }));
}
