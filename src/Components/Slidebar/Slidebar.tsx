import { ChevronDown, CircleAlert, ClipboardList, ShieldUser, Stethoscope, Users } from "lucide-react";
import { ImageWithFallback } from "../../app/components/ui/ImageWithFallback";
import logoIrvet from "../../assets/logo_irvet.jpeg";

export interface SidebarItem {
  key: string;
  label: string;
}

interface SidebarProps {
  totalOrdenes: number;
  items?: SidebarItem[];
  activeModule?: string;
  onSelectModule?: (moduleKey: string) => void;
}

const defaultItems: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard"},
  { key: "services", label: "Registro de Servicios" },
  { key: "pending", label: "Pendientes" },
  { key: "clients", label: "Clientes" },
  { key: "veterinary", label: "Médicos Veterinarios" },
  { key: "manager", label: "Responsables" },
];

export default function Sidebar({
  totalOrdenes,
  items = defaultItems,
  activeModule,
  onSelectModule,
}: SidebarProps) {
  const getMenuIcon = (key: string) => {
    if (key === "pending") return CircleAlert;
    if (key === "clients") return Users;
    if (key === "veterinary") return Stethoscope;
    if (key === "manager") return ShieldUser;
    return ClipboardList;
  };

  return (
    <aside className="w-60 shrink-0 flex flex-col h-full" style={{ background: "#1B2B4B" }}>
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

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">
          Módulos
        </p>

        {items.map((item) => {
          const Icon = getMenuIcon(item.key);
          const isActive = activeModule === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectModule?.(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-left transition-colors"
              style={{
                background: isActive ? "#2BB5C3" : "transparent",
                boxShadow: isActive ? "0 4px 14px rgba(43,181,195,0.35)" : "none",
                color: "white",
              }}
            >
              <Icon size={16} strokeWidth={2.5} />
              {item.label}

              {item.key === "services" && totalOrdenes > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-white/15 px-1.5 py-0.5 rounded-md">
                  {totalOrdenes}
                </span>
              )}
            </button>
          );
        })}
      </nav>

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
