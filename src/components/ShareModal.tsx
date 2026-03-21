import { useState } from "react";

interface ShareModalProps {
  onClose: () => void;
}

const ShareModal = ({ onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const url = "https://www.ecometrics.sbs/public-dashboard";
  const iframe = `<iframe src="${url}" width="100%" height="600" frameborder="0"></iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center win-overlay animate-fade-in" onClick={onClose}>
      <div
        className="relative win-acrylic-strong rounded-xl p-6 w-full max-w-md mx-4 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Windows 11 Dialog Title Bar */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-base tracking-tight">Compartir Dashboard</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-100 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">URL Pública</label>
            <div className="flex gap-2">
              <input value={url} readOnly className="win-input text-xs" />
              <button onClick={() => copyText(url, "url")} className="win-btn-accent text-xs px-3 whitespace-nowrap">
                {copied === "url" ? "¡Copiado! ✓" : "Copiar"}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Código iframe</label>
            <div className="relative">
              <pre className="bg-secondary rounded-lg p-3 text-[10px] font-mono overflow-x-auto border border-border">{iframe}</pre>
              <button
                onClick={() => copyText(iframe, "iframe")}
                className="absolute top-2 right-2 win-btn-standard text-[10px] px-2 py-0.5"
              >
                {copied === "iframe" ? "✓" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { icon: "✅", label: "Vista pública" },
              { icon: "👁️", label: "Solo lectura" },
              { icon: "🔄", label: "Tiempo real" },
              { icon: "📱", label: "Responsive" },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2 text-xs border border-border">
                <span>{f.icon}</span> {f.label}
              </div>
            ))}
          </div>

          <button onClick={onClose} className="win-btn-standard w-full mt-1">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
