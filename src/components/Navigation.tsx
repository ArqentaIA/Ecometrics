import { Link, useLocation } from "react-router-dom";
import { useEcoMetrics } from "@/context/EcoMetricsContext";

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
    <nav className="sticky top-0 z-50 bg-nav text-nav-foreground">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-heading font-bold text-sm tracking-wide">
            {showBell ? "PANEL DE ANÁLISIS" : "EcoMetrics"} <span className="font-normal opacity-70">| IRM Group</span>
          </span>
        </div>

        <div className="flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-1.5 text-sm rounded-md transition-all duration-150 ${
                location.pathname === l.to
                  ? "bg-nav-foreground/15 font-medium border-b-2 border-nav-foreground"
                  : "opacity-70 hover:opacity-100 hover:bg-nav-foreground/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {showBell && (
            <button className="relative p-1.5 rounded-md hover:bg-nav-foreground/10 transition-colors">
              <span>🔔</span>
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full text-[9px] flex items-center justify-center font-bold">3</span>
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-nav-foreground/10 hover:bg-nav-foreground/20 transition-colors text-sm"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold">A</div>
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
