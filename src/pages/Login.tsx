import { useState } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useNavigate } from "react-router-dom";
import logoImr from "@/assets/logo-imr.png";

const Login = () => {
  const { login } = useEcoMetrics();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await login(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(120 20% 94%) 0%, hsl(90 18% 95%) 100%)",
      }}>
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(120 20% 20%) 0.5px, transparent 0.5px)",
          backgroundSize: "20px 20px",
        }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(122 39% 49% / 0.3), transparent 70%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(90 30% 50% / 0.25), transparent 70%)" }} />

      <div className="animate-fade-slide-up relative z-10 w-full max-w-[400px] mx-4">
        <div className="win-acrylic-strong rounded-xl p-8">
          <div className="flex flex-col items-center mb-7">
            <img src={logoImr} alt="IMR Group" className="h-20 object-contain mb-4" />
            <h1 className="font-heading text-[28px] font-bold text-foreground mt-2 tracking-tight">EcoMetrics</h1>
            <p className="text-xs text-muted-foreground mt-1">Inicia sesión para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="win-input" placeholder="usuario@empresa.com" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} className="win-input pr-10"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div onClick={() => setRemember(!remember)}
                  className={`win-toggle ${remember ? "win-toggle-on" : ""}`}>
                  <div className={`win-toggle-thumb ${remember ? "" : "left-[3px]"}`}
                    style={!remember ? { left: "3px" } : {}} />
                </div>
                <span className="text-xs text-foreground">Recordarme</span>
              </label>
              <button type="button" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</button>
            </div>
            <button type="submit" disabled={loading}
              className="win-btn-accent w-full h-10 text-sm font-semibold disabled:opacity-70 mt-2">
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin-slow" />
              ) : "Iniciar Sesión"}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-4 opacity-60">
          EcoMetrics IRM v2.0 · Plataforma de Sustentabilidad
        </p>
      </div>
    </div>
  );
};

export default Login;
