import { useState } from "react";
import type { Orden } from "../../types";
import { ChevronLeft, ChevronRight, Eye, FileText, Filter, Pencil, Search, Trash2 } from "lucide-react";


interface ServiceHistoryProps {
    ordenes: Orden[];
    onView: (o: Orden) => void;
    onEdit: (o: Orden) => void;
    onDeleteRequest: (id: string) => void;
}

const today = new Date().toISOString().split("T")[0];

const BADGE: Record<string, string> = {
  Pagado:             "bg-emerald-50 text-emerald-700",
  "Pendiente por pago": "bg-amber-50 text-amber-700",
};

const TIPO_COLOR: Record<string, string> = {
  Laboratorio:      "bg-indigo-50 text-indigo-700",
  Ecografía:        "bg-violet-50 text-violet-700",
  Radiología:       "bg-sky-50 text-sky-700",
  "Consulta Médica":"bg-teal-50 text-teal-700",
};

export default function ServiceHistory({ordenes, onView, onEdit, onDeleteRequest,}: ServiceHistoryProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const filtered = ordenes.filter((o) => {
        const q = search.toLowerCase();
        const matchQ = 
        !q || 
        o.factura.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        o.responsable.toLowerCase().includes(q) ||
        o.fecha.includes(q) ||
        o.tipoServicio.toLowerCase().includes(q);

        if(filter === "hoy") return matchQ && o.fecha === today;
        if (filter === "semana") {
            const d = new Date(o.fecha);
            const now = new Date();
            return matchQ && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if(filter === "prioritaria") return matchQ && o.prioridad === "Prioritaria";
        if(filter === "pagado") return matchQ && o.estadoPago === "Pagado";
        if(filter === "pendiente") return matchQ && o.estadoPago === "Pendiente por pago";
        return matchQ;
    });
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage -1 ) * rowsPerPage, safePage * rowsPerPage);

    const changeFilter = (f: string) => {setFilter(f); setCurrentPage(1);};
    
    return(
        <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] overflow-hidden" style={{boxShadow: "0 1px 6px rgba(27, 43, 75, 0.06)"}}>
            <div className="px-6 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[15px] font-extrabold text-[#1B2B4B] tracking-tight">
                        Historial de Órdenes
                    </h2>
                    <span className="text-[11px] font-bold text-[#6B7AA9]">{filtered.length} registros</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} placeholder="Buscar por factura, cliente, tipo de servicio, fecha o responsable..." className="w-full pl-8 pr-4 py-2 text-[13px] bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] placeholder:text-gray-400 transition-colors" />
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            {id: "todos", label: "Todos"},
                            {id: "hoy", label: "Hoy"},
                            {id: "semana", label: "Semana"},
                            {id: "mes", label: "Mes"},
                            {id: "prioritaria", label: "🔴 Prioritaria"},
                            {id: "pagado", label: "Pagado"},
                            {id: "pendiente", label: "Pendiente"},
                        ].map((f) => (
                            <button key={f.id} onClick={() => changeFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transtion-colors ${filter === f.id ? "text-white": "bg-[#F4F7FA] text-[#6B7A99] hover:bg-gray-200"}`} style={filter === f.id ? {background: "#1B2B4B"}: {}}>
                                {f.label}
                            </button>
                        ))}
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#F4F7FA] text-[#6B7A99] hover:bg-gray-200 transition-colors">
                            <Filter size={11}/> Tipo
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#F4F7FA] text-[#6B7A99] hover:bg-gray-200 transition-colors">
                            <Filter size={11}/> Responsable
                        </button>
                    </div>
                </div>
            </div>

            {
                ordenes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-[#F4F7FA] flex items-center justify-center mb-4">
                            <FileText size={28} className="text-[#6B7A99]"/>
                        </div>
                        <p className="text-[#1B2B4B] font-bold text-[15px] mb-1">Sin órdenes registradas</p>
                        <p className="text-[#6B7A99] text-[13px] text-center max-w-xs">
                            Complete el formulario de arriba y presione <strong>Guardar Orden</strong> para añadir la primera.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{background: "#F8FAFC"}}>
                                    {[
                                        "Factura", "Fecha", "Cliente", "Tipo de Servicio",
                                        "Cant.", "Mascotas", "Responsable", "Estado Pago", "Valor Total", "Acciones", 
                                    ].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider whitespace-nowrap border-b border-[rgba(27, 43, 75, 0.05)]">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    paginated.map((o) => (
                                        <tr key={o.id} className="border-b border-[rgba(27, 43, 75, 0.04)] hover:bg-[#F8FAFC] transtion-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-[12px] font-bold" style={{color: "#2BB5C3"}}>{o.factura}</span>
                                                    {
                                                        o.prioridad === "Prioritaria" && (
                                                            <span className="text-[10px] font-bold text-rose-500">🔴 Prioritaria</span>
                                                        )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-[#6B7A99] whitespace-nowrap">{o.fecha}</td>
                                            <td className="px-4 py-3 text-[12px] font-semibold text-[#1B2B4B]">{o.cliente || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${TIPO_COLOR[o.tipoServicio] || "bg-gray-100 text-gray-600"}`}>
                                                    {o.tipoServicio || "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[13px] font-bold text-[#1B2B4B] text-center">{o.cantidad}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] font-bold text-[#1B2B4B]">{o.mascotas.length}</span>
                                                    <span className="text-[11px] text-[#6B7A99]">
                                                        {o.mascotas.length === 1 ? "mascota" : "mascotas"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-[#6B7A99] font-medium">{o.responsable}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${BADGE[o.estadoPago] || "bg-gray-100 text-gray-600"}`}>{o.estadoPago}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[13px] font-extrabold ${o.movimiento === "Ingreso" ? "text-emerald-600" : "text-rose-500"}`}>
                                                    {o.movimiento === "Ingreso" ? "+" : "-"} ${Number(o.valorTotal || 0).toLocaleString("es-CO")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => onView(o)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver">
                                                        <Eye size={13}/>
                                                    </button>
                                                    <button onClick={() => onEdit(o)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Editar">
                                                        <Pencil size={13}/>
                                                    </button>
                                                    <button onClick={() => onDeleteRequest(o.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors" title="Eliminar">
                                                        <Trash2 size={13}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {
                                        paginated.length === 0 && (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-10 text-center text-[#6B7A99] text-[13px]">
                                                    No se encontraron registros con los filtros aplicados.
                                                </td>
                                            </tr>
                                        )}
                            </tbody>
                        </table>
                    </div>
                )}

                {
                    ordenes.length > 0 && (
                        <div className="px-6 py-3 flex items-center justify-between border-t border-[rgba(27, 43, 75, 0.06)]">
                            <div className="flex items-center gap-2 text-[12px] text-[#6B7A99]">
                                <span>Mostrar</span>
                                <select value={rowsPerPage} onChange={(e) => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}} className="border border-[rgba(27,43,75,0.1)] rounded-lg px-2 py-1 text-[12px] bg-white focus:outline-none">
                                    {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <span>registros — {filtered.length} total</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronLeft size={15}/>
                                </button>
                                {
                                    Array.from({length: Math.min(5, totalPages)}, (_, i) => i + 1).map((p) => (
                                        <button key={p} onClick={() => setCurrentPage(p)} className={`w-7 h-7 rounded-lg text-[12px] font-bold transition-colors ${safePage === p ? "text-white" : "hover:bg-gray-100 text-[#6B7A99]"}`} style={safePage === p ? {background: "#2BB5C3"}: {}}>
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                                        <ChevronRight size={15}/>
                                    </button>
                            </div>
                        </div>
                    )}
        </div>
    );
}