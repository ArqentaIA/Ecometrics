import { useState } from "react";
import { useEcoMetrics } from "@/context/EcoMetricsContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { login } = useEcoMetrics();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login();
      navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)",
      }}>
      {/* Dot grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #2d4a2d 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

      <div className="animate-fade-slide-up relative z-10 w-full max-w-md mx-4">
        <div className="acrylic-strong rounded-2xl p-8" style={{ boxShadow: "var(--shadow-acrylic)" }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-3">
              <span className="text-3xl">🌿</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold text-foreground">IRM Group</span>
              <span className="block text-xs text-muted-foreground">next gen</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground mt-4">EcoMetrics</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="fluent-input w-full"
                placeholder="usuario@empresa.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="fluent-input w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setRemember(!remember)}
                  className={`w-10 h-5 rounded-full transition-colors duration-150 relative cursor-pointer ${remember ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow transition-transform duration-150 ${remember ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-foreground">Recordarme</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fluent-btn-primary w-full h-11 text-base font-semibold disabled:opacity-70"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin-slow" />
              ) : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
