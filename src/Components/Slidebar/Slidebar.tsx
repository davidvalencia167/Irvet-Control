import { ChevronDown, CircleAlert, ClipboardList, MapPinned, ShieldUser, Stethoscope, Users } from "lucide-react";
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
    if (key === "dispatch") return MapPinned;
    return ClipboardList;
  };

  return (
    <aside className="flex h-full w-16 shrink-0 flex-col md:w-60" style={{ background: "#1B2B4B" }}>
      <div className="border-b border-white/10 px-2 py-4 md:px-5 md:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5">
            <ImageWithFallback
              src={logoIrvet}
              alt="IRVET Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="text-white font-extrabold text-[13px] leading-tight tracking-tight">
              IRVET Control
            </p>
            <p className="text-white/40 text-[9.5px] leading-tight mt-0.5">
              Sistema de Gestión para<br />Laboratorio Veterinario
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-1 py-4 md:px-3">
        <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-widest text-white/25 md:block">
          Módulos
        </p>

        {items.map((item) => {
          const Icon = getMenuIcon(item.key);
          const isActive = activeModule === item.key;

          return (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={() => onSelectModule?.(item.key)}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-2 py-2.5 text-left text-[13px] font-semibold transition-colors md:justify-start md:px-3"
              style={{
                background: isActive ? "#2BB5C3" : "transparent",
                boxShadow: isActive ? "0 4px 14px rgba(43,181,195,0.35)" : "none",
                color: "white",
              }}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span className="hidden md:inline">{item.label}</span>

              {item.key === "services" && totalOrdenes > 0 && (
                <span className="ml-auto hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold md:inline">
                  {totalOrdenes}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-2 pb-5 pt-3 md:px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
            style={{ background: "#2BB5C3" }}
          >
            CA
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="text-white text-[12px] font-semibold truncate">Carlos</p>
            <p className="text-white/35 text-[10px] truncate">Administrador</p>
          </div>
          <ChevronDown size={13} className="hidden shrink-0 text-white/30 md:block" />
        </div>
      </div>
    </aside>
  );
}
