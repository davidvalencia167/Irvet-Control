import { useState } from "react";
import type { Orden } from "../../types";
import type { DailyTask } from "../../types/tasks";
import { ChevronLeft, ChevronRight, Eye, FileText, Filter, Pencil, Search, Trash2 } from "lucide-react";
import { calculatePaymentSummary, summarizeByCourier } from "../../utils/payment";
import { DOMICILIARIOS } from "../../constants";


interface ServiceHistoryProps {
    ordenes: Orden[];
    tasks: DailyTask[];
    onView: (o: Orden) => void;
    onEdit: (o: Orden) => void;
    onDeleteRequest: (id: string) => void;
}

const today = new Date().toISOString().split("T")[0];

const BADGE: Record<string, string> = {
  Pagado:             "bg-emerald-50 text-emerald-700",
  "Pendiente por pago": "bg-amber-50 text-amber-700",
  "Pago parcial": "bg-orange-50 text-orange-700",
};

const TIPO_COLOR: Record<string, string> = {
  Laboratorio:      "bg-indigo-50 text-indigo-700",
  Ecografía:        "bg-violet-50 text-violet-700",
  Radiología:       "bg-sky-50 text-sky-700",
  Radiografía:      "bg-sky-50 text-sky-700",
  "Consulta Médica":"bg-teal-50 text-teal-700",
};

export default function ServiceHistory({ordenes, tasks, onView, onEdit, onDeleteRequest,}: ServiceHistoryProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("todos");
    const [courierFilter, setCourierFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const filtered = ordenes.filter((o) => {
        const q = search.toLowerCase();
        const matchQ = 
        !q || 
        o.numeroOrden.toLowerCase().includes(q) ||
        o.factura.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        o.responsable.toLowerCase().includes(q) ||
        o.domiciliario.toLowerCase().includes(q) ||
        o.fecha.includes(q) ||
        o.tipoServicio.toLowerCase().includes(q);
        const matchCourier = !courierFilter
          ? true
          : courierFilter === "__sin_asignar__"
            ? !o.domiciliario
            : o.domiciliario === courierFilter;

        if(filter === "hoy") return matchQ && matchCourier && o.fecha === today;
        if (filter === "semana") {
            const d = new Date(o.fecha);
            const now = new Date();
            const diff = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
            return matchQ && matchCourier && diff >= 0 && diff < 7;
        }
        if(filter === "prioritaria") return matchQ && matchCourier && (o.prioridad === "Prioritaria" || o.prioridad === "Urgente");
        if(filter === "pagado") return matchQ && matchCourier && o.estadoPago === "Pagado";
        if(filter === "pendiente") return matchQ && matchCourier && o.estadoPago !== "Pagado";
        if(filter === "recepcion") return matchQ && matchCourier && o.estadoOrden === "Pendiente de recepción";
        return matchQ && matchCourier;
    });
    
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage -1 ) * rowsPerPage, safePage * rowsPerPage);
    const courierSummary = summarizeByCourier(filtered);

    const changeFilter = (f: string) => {setFilter(f); setCurrentPage(1);};
    
    return(
        <div className="space-y-5">
        {courierSummary.length > 0 && (
            <div className="rounded-2xl border border-[#2BB5C3]/20 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h2 className="text-[15px] font-extrabold text-[#1B2B4B]">Consolidado de recaudo por domiciliario</h2>
                        <p className="text-[11px] text-[#6B7A99]">Acumulado de las órdenes filtradas; cada pago se cuenta una sola vez.</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#6B7A99]">{courierSummary.length} domiciliarios</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {courierSummary.map((item) => (
                        <div key={item.domiciliario} className="rounded-xl bg-[#F8FAFC] p-3">
                            <p className="text-[12px] font-extrabold text-[#1B2B4B]">{item.domiciliario}</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                                <span className="text-[#6B7A99]">Servicios <b className="block text-[#1B2B4B]">${item.services.toLocaleString("es-CO")}</b></span>
                                <span className="text-[#6B7A99]">Recaudado <b className="block text-emerald-700">${item.received.toLocaleString("es-CO")}</b></span>
                                <span className="text-[#6B7A99]">Gastos <b className="block text-rose-600">${item.expenses.toLocaleString("es-CO")}</b></span>
                                <span className="text-[#6B7A99]">Neto <b className="block text-[#1B2B4B]">${item.net.toLocaleString("es-CO")}</b></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] overflow-hidden" style={{boxShadow: "0 1px 6px rgba(27, 43, 75, 0.06)"}}>
            <div className="px-6 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[15px] font-extrabold text-[#1B2B4B] tracking-tight">
                        Historial de Órdenes
                    </h2>
                    <span className="text-[11px] font-bold text-[#6B7AA9]">{filtered.length} registros</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-55">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} placeholder="Buscar por orden, factura, cliente, servicio, fecha o responsable..." className="w-full pl-8 pr-4 py-2 text-[13px] bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] placeholder:text-gray-400 transition-colors" />
                    </div>

                    <div className="flex gap-1.5 flex-wrap">
                        <select
                            value={courierFilter}
                            onChange={(e) => { setCourierFilter(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-[#F4F7FA] text-[#6B7A99] border-0 focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25"
                            aria-label="Filtrar por domiciliario"
                        >
                            <option value="">Todos los domiciliarios</option>
                            {DOMICILIARIOS.map((domiciliario) => <option key={domiciliario} value={domiciliario}>{domiciliario}</option>)}
                            <option value="__sin_asignar__">Sin domiciliario asignado</option>
                        </select>
                        {[
                            {id: "todos", label: "Todos"},
                            {id: "hoy", label: "Hoy"},
                            {id: "semana", label: "Semana"},
                            {id: "mes", label: "Mes"},
                            {id: "prioritaria", label: "🔴 Prioritaria / Urgente"},
                            {id: "pagado", label: "Pagado"},
                            {id: "pendiente", label: "Pendiente pago"},
                            {id: "recepcion", label: "Pendiente recepción"},
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
                            Registre la información general y presione <strong>Guardar Solicitud</strong>; podrá completar la orden cuando llegue el domiciliario.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{background: "#F8FAFC"}}>
                                    {[
                                        "N° Orden", "Factura", "Fecha", "Cliente", "Tipo de Servicio",
                                        "Cant.", "Mascotas", "Responsable", "Domiciliario", "Estado Orden", "Estado Pago", "Valor Total", "Recaudado", "Saldo", "Acciones", 
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
                                                <span className="font-mono text-[12px] font-bold" style={{color: "#1B2B4B"}}>{o.numeroOrden || o.mascotas[0]?.numeroOrden || "—"}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-[12px] font-bold" style={{color: "#2BB5C3"}}>{o.factura}</span>
                                                    {
                                                        (o.prioridad === "Prioritaria" || o.prioridad === "Urgente") && (
                                                            <span className="text-[10px] font-bold text-rose-500">🔴 {o.prioridad}</span>
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
                                            <td className="px-4 py-3 text-[12px] text-[#6B7A99]">{o.domiciliario || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${o.estadoOrden === "Completada" ? "bg-emerald-50 text-emerald-700" : o.estadoOrden === "En proceso" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{o.estadoOrden}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${BADGE[o.estadoPago] || "bg-gray-100 text-gray-600"}`}>{o.estadoPago}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[13px] font-extrabold ${o.movimiento === "Ingreso" ? "text-emerald-600" : "text-rose-500"}`}>
                                                    {o.movimiento === "Ingreso" ? "+" : "-"} ${Number(o.valorTotal || 0).toLocaleString("es-CO")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] font-bold text-emerald-600">${calculatePaymentSummary(o.valorTotal, o.pagos, o.gastosDomiciliario).received.toLocaleString("es-CO")}</td>
                                            <td className="px-4 py-3 text-[12px] font-bold text-amber-700">${calculatePaymentSummary(o.valorTotal, o.pagos, o.gastosDomiciliario).pending.toLocaleString("es-CO")}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => onView(o)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Ver">
                                                        <Eye size={13}/>
                                                    </button>
                                                    <button onClick={() => onEdit(o)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title={o.estadoOrden === "Pendiente de recepción" ? "Completar orden" : "Editar"}>
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
                                                <td colSpan={15} className="px-4 py-10 text-center text-[#6B7A99] text-[13px]">
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
        {tasks.some((task) => task.movement === "Gasto" && Number(task.amount) > 0) && (
            <div className="overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm">
                <div className="border-b border-rose-100 bg-rose-50 px-6 py-4">
                    <h2 className="text-[15px] font-extrabold text-rose-800">Gastos de tareas diarias</h2>
                    <p className="mt-1 text-[11px] text-rose-700">Estos valores se tienen en cuenta para el cierre de caja de cada responsable.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#F8FAFC]">
                            <tr>
                                {["Fecha", "Tarea", "Responsable", "Estado", "Valor"].map((heading) => (
                                    <th key={heading} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]">{heading}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.filter((task) => task.movement === "Gasto" && Number(task.amount) > 0).map((task) => (
                                <tr key={task.id} className="border-t border-slate-100">
                                    <td className="px-6 py-3 text-[12px] text-[#6B7A99]">{task.completedDate || task.dueDate || "—"}</td>
                                    <td className="px-6 py-3 text-[12px] font-semibold text-[#1B2B4B]">{task.description}</td>
                                    <td className="px-6 py-3 text-[12px] text-[#6B7A99]">{task.responsible || "Sin asignar"}</td>
                                    <td className="px-6 py-3 text-[12px] text-[#6B7A99]">{task.status}</td>
                                    <td className="px-6 py-3 text-[13px] font-extrabold text-rose-600">- ${Number(task.amount).toLocaleString("es-CO")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        </div>
    );
}