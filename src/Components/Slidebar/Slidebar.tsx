import { ChevronDown, ClipboardList } from "lucide-react";
import { ImageWithFallback } from "../../app/components/ui/ImageWithFallback";
import logoIrvet from "../../assets/logo_irvet.jpeg";

interface SidebarProps {
  totalOrdenes: number;
}

export default function Sidebar({ totalOrdenes }: SidebarProps) {
  return (
    <aside className="w-[240px] shrink-0 flex flex-col h-full" style={{ background: "#1B2B4B" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 p-0.5">
            <ImageWithFallback
              src={logoIrvet}
              alt="IRVET Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-extrabold text-[13px] leading-tight tracking-tight">
              IRVET Control
            </p>
            <p className="text-white/40 text-[9.5px] leading-tight mt-0.5">
              Sistema de Gestión para<br />Laboratorio Veterinario
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
          Módulos
        </p>
        <div
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "#2BB5C3", boxShadow: "0 4px 14px rgba(43,181,195,0.35)" }}
        >
          <ClipboardList size={16} strokeWidth={2.5} />
          Registro de Servicios
          {totalOrdenes > 0 && (
            <span className="ml-auto text-[10px] font-bold bg-white/15 px-1.5 py-0.5 rounded-md">
              {totalOrdenes}
            </span>
          )}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 pb-5 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: "#2BB5C3" }}
          >
            GA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-semibold truncate">Gissel Admin</p>
            <p className="text-white/35 text-[10px] truncate">Administrador</p>
          </div>
          <ChevronDown size={13} className="text-white/30 shrink-0" />
        </div>
      </div>
    </aside>
  );
}
