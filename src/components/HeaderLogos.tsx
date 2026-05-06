import logoIMR from "@/assets/logo-imr.png";
import logoAC from "@/assets/logo-ac-recicladores.png";

export default function HeaderLogos({ size = "h-16", showTitle = true }: { size?: string; showTitle?: boolean }) {
  return (
    <div className="flex items-center gap-6 shrink-0 w-full">
      <img src={logoIMR} alt="IRM Circular Intelligence" className={`${size} w-auto object-contain`} />
      <img src={logoAC} alt="Asociación de Recicladores del Estado de Querétaro A.C." className={`${size} w-auto object-contain`} />
      {showTitle && (
        <div className="flex-1 text-center">
          <h1 className="font-heading text-[24px] font-bold text-foreground tracking-tight uppercase">IRM Circular Intelligence</h1>
        </div>
      )}
    </div>
  );
}
