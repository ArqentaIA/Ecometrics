import { QRCodeSVG } from "qrcode.react";
import { abbreviateHash, getVerificationUrl } from "@/lib/reportCertification";

interface CertificationBlockProps {
  folio: string;
  firma: string;
  hash: string;
  datasetId: string;
  fechaEmision: string;
  totalRegistros: number;
}

const CertificationBlock = ({
  folio, firma, hash, datasetId, fechaEmision, totalRegistros,
}: CertificationBlockProps) => {
  const verifyUrl = getVerificationUrl(folio);
    <div className="border border-border/60 rounded-lg bg-muted/30 p-5 mt-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/80">
            🔒 Documento Certificado Digitalmente
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
            <div>
              <span className="text-muted-foreground">Folio:</span>{" "}
              <span className="font-mono font-semibold text-foreground">{folio}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Firma digital:</span>{" "}
              <span className="font-mono font-semibold text-foreground text-[10px]">{firma}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha de emisión:</span>{" "}
              <span className="font-medium text-foreground">{new Date(fechaEmision).toLocaleString("es-MX")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Hash (SHA-256):</span>{" "}
              <span className="font-mono text-[10px] text-foreground">{abbreviateHash(hash)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID Dataset:</span>{" "}
              <span className="font-mono text-foreground">{datasetId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Registros:</span>{" "}
              <span className="font-semibold text-foreground">{totalRegistros}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Sistema:</span>{" "}
              <span className="font-semibold text-foreground">ECOMETRICS</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <QRCodeSVG value={verifyUrl} size={80} level="M" />
          <span className="text-[9px] text-muted-foreground text-center max-w-[90px]">Escanear para verificar</span>
        </div>
      </div>
      <div className="mt-4 border-t border-border/40 pt-3 space-y-2">
        <p className="text-[11px] leading-relaxed text-[hsl(220,9%,46%)]">
          Los factores de conversión utilizados se basan en metodologías y referencias técnicas reconocidas internacionalmente, como el GHG Protocol, el EPA Waste Reduction Model (WARM) v16 (diciembre 2023) y literatura especializada del sector de reciclaje, lo que permite estimar de forma consistente y verificable los impactos ambientales asociados a la recuperación de materiales.
        </p>
        <p className="text-[11px] leading-relaxed text-[hsl(220,9%,46%)]">
          Este documento ha sido generado automáticamente por el sistema ECOMETRICS y cuenta con mecanismos de integridad y trazabilidad. Cualquier alteración posterior invalida su autenticidad.
        </p>
      </div>
    </div>
  );
};

export default CertificationBlock;
