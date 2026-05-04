import logoIMR from "@/assets/logo-imr.png";
import logoAC from "@/assets/logo-ac-recicladores.png";

export default function HeaderLogos({ size = "h-16" }: { size?: string }) {
  return (
    <div className="flex items-center gap-6 shrink-0">
      <img src={logoIMR} alt="IMR" className={`${size} w-auto object-contain`} />
      <img src={logoAC} alt="Asociación de Recicladores del Estado de Querétaro A.C." className={`${size} w-auto object-contain`} />
    </div>
  );
}
