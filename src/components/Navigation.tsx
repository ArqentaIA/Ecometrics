import { Link, useLocation } from "react-router-dom";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import logoImr from "@/assets/logo-imr.png";

interface NavigationProps {
  showBell?: boolean;
}

const Navigation = ({ showBell }: NavigationProps) => {
  const location = useLocation();
  const { logout } = useEcoMetrics();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/capture", label: "Captura" },
    { to: "#", label: "Histórico" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-nav text-nav-foreground"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-5 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={logoImr} alt="IMR Group" className="h-8 object-contain" />
          <span className="text-[11px] opacity-50 mx-1">|</span>
          <span className="font-heading font-semibold text-[13px] tracking-tight">
            {showBell ? "PANEL DE ANÁLISIS" : "EcoMetrics"}
          </span>
        </div>

        <div className="flex items-center h-full">
          {links.map(l => {
            const isActive = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to}
                className={`relative h-full flex items-center px-4 text-[13px] transition-all duration-150 ${
                  isActive ? "text-nav-foreground font-semibold" : "text-nav-foreground/60 hover:text-nav-foreground/90 hover:bg-nav-foreground/5"
                }`}>
                {l.label}
                {isActive && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] bg-nav-foreground rounded-t-full" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {showBell && (
            <button className="relative w-8 h-8 rounded-md flex items-center justify-center hover:bg-nav-foreground/10 transition-colors">
              <span className="text-sm">🔔</span>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border border-nav" />
            </button>
          )}
          <button onClick={logout}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-nav-foreground/10 transition-colors text-[13px]">
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold">A</div>
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
