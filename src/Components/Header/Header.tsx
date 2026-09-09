import { Search, Bell, Plus, ChevronDown } from "lucide-react";

interface HeaderProps {
  editingId?: string | null;
  onNewOrder?: () => void;
  title?: string;
  showNewOrderButton?: boolean;
}

export default function Header({
  editingId,
  onNewOrder,
  title,
  showNewOrderButton = true,
}: HeaderProps) {
  const heading = title ?? (editingId ? "✏️ Editando Orden" : "Registro de Servicios");

  return (
    <header className="h-[60px] bg-white border-b border-[rgba(27,43,75,0.08)] flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h1 className="text-base font-extrabold text-[#1B2B4B] tracking-tight">
          {heading}
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Búsqueda rápida..."
            className="pl-8 pr-4 py-1.5 text-[13px] bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] rounded-xl w-48 focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] placeholder:text-gray-400 transition-colors"
          />
        </div>

        <button className="relative w-9 h-9 rounded-xl bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#E8449A" }} />
        </button>

        <div className="flex items-center gap-1.5 cursor-pointer">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold" style={{ background: "#1B2B4B" }}>
            GA
          </div>
          <ChevronDown size={13} className="text-gray-400" />
        </div>

        {showNewOrderButton && onNewOrder && (
          <button
            onClick={onNewOrder}
            className="flex items-center gap-1.5 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-colors"
            style={{ background: "#E8449A", boxShadow: "0 4px 12px rgba(232,68,154,0.35)" }}
          >
            <Plus size={15} />
            Nueva Orden
          </button>
        )}
      </div>
    </header>
  );
}
