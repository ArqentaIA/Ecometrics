import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEcoMetrics } from "@/context/EcoMetricsContext";

interface NavigationProps {
  showBell?: boolean;
}

const Navigation = ({ showBell }: NavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user, roleLabel } = useEcoMetrics();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/capture", label: "Captura" },
    { to: "#", label: "Histórico" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <nav className="sticky top-0 z-50 bg-nav text-nav-foreground"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-7xl mx-auto px-5 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5" />
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px]">
            <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold">{initials}</div>
            <span className="hidden sm:inline truncate max-w-[120px]">{user?.email ?? "Usuario"}</span>
          </div>
          <button onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-destructive/20 transition-colors text-[12px] text-nav-foreground/70 hover:text-destructive-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
