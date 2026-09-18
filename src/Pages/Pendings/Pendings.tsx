import { useMemo, useState } from "react";
import type { Orden } from "../../types";
import { AlertTriangle, Filter, Search } from "lucide-react";

type FiltroEstado = "todos" | "pendiente" | "parcial" | "vencido";

const formatMoney = (value: number) => 
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

export default function Pendings({ordenes}:{ordenes: Orden[]}) {
    const [search, setSearch] = useState("");
    const [veterinaria, setVeterinaria] = useState("Todas");
    const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");

    const veterinarias = useMemo(
        () => Array.from(
            new Set(
                ordenes
                    .map((o) => o.cliente?.trim())
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b))
            )
        ),
        [ordenes]
    );

    const pendientes = useMemo(() => {
        return ordenes
        .map((orden) => {
            const totalPagado = (orden.pagos ?? []).reduce(
            (sum, pago) => sum + Number(pago.valor || 0),
            0
            );

            const totalOrden = Number(orden.valorTotal || 0);
            const saldoPendiente = Math.max(0, totalOrden - totalPagado);

            const mascotaNombre = (orden.mascotas ?? [])
            .map((m) => m.nombre || "Sin nombre")
            .join(", ");

            const exámenes = (orden.mascotas ?? [])
            .flatMap((m) => m.servicios ?? [])
            .map((s) => s.descripcion)
            .join(", ");

            return {
            ...orden,
            totalPagado,
            saldoPendiente,
            mascotaNombre,
            exámenes: exámenes || "Sin exámenes",
            };
        })
        .filter((orden) => {
            const matchVeterinaria =
            veterinaria === "Todas" || orden.cliente === veterinaria;

            const matchSearch =
            !search ||
            [
                orden.cliente,
                orden.numeroOrden,
                orden.factura,
                orden.tipoServicio,
                orden.descripcionServicio,
                orden.mascotaNombre,
                orden.exámenes,
            ]
                .join(" ")
                .toLowerCase()
                .includes(search.toLowerCase());

            const matchEstado =
            estadoFiltro === "todos"
                ? orden.saldoPendiente > 0
                : estadoFiltro === "pendiente"
                ? orden.estadoPago === "Pendiente por pago"
                : estadoFiltro === "parcial"
                    ? orden.estadoPago === "Pago parcial"
                    : orden.saldoPendiente > 0 && orden.estadoPago !== "Pagado";

            return matchVeterinaria && matchSearch && matchEstado;
        })
        .sort((a, b) => b.saldoPendiente - a.saldoPendiente);
    }, [ordenes, search, veterinaria, estadoFiltro]);

    const totalPendienteGeneral = pendientes.reduce((sum, orden) => sum + orden.saldoPendiente, 0);

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">
                        Módulo de pendientes
                    </h1>
                    <p className="text-[13px] text-[#6B7A99] mt-0.5">
                        Veterinarias con saldo pendiente por cobrar
                    </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700">
                        Total pendiente
                    </p>
                    <p className="text-[22px] font-extrabold text-amber-700">
                        {formatMoney(totalPendienteGeneral)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Veterinarias
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-[#1B2B4B]">
                        {veterinarias.length}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Ordenes pendientes
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-[#F59E0B]">
                        {pendientes.length}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Deuda total
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-[#E11D48]">
                        {formatMoney(totalPendienteGeneral)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.08)] overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                    <div className="relative flex-1 min-w-55">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar veterinaria, orden, mascota o examen..." className="w-full pl-8 pr-4 py-2 text-[13px] bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3]" />
                    </div>

                    <div className="relative min-w-55">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <select value={veterinaria} onChange={(e) => setVeterinaria(e.target.value)} className="w-full pl-8 pr-4 py-2 text-[13px] bg-[#F4F7FA] border border-[rgba(27,43,75,0.08)] rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25">
                            <option value="Todas">Todas las veterinarias</option>
                            {
                                veterinarias.map((vet) => (
                                    <option key={vet} value={vet}>{vet}</option>
                                ))}
                        </select>
                    </div>

                    <div className="flex gap-1 bg-[#F4F7FA] rounded-xl p-1">
                        {[
                            {value: "todos", label: "Todos"},
                            {value: "pendiente", label: "Pendiente"},
                            {value: "parcial", label: "Parcial"},
                            {value: "vencido", label: "Vencido"},
                        ].map((item) => (
                            <button key={item.value} type="button" onClick={() => setEstadoFiltro(item.value as FiltroEstado)} className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${estadoFiltro === item.value ? "bg-[#2BB5C3] text-white" : "text-[#6B7A99] hover:bg-gray-100"}`}>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-287.5">
                        <thead>
                            <tr className="border-b border-[rgba(27, 43, 75, 0.06)]">
                                {[
                                    "Veterinaria",
                                    "N° Orden",
                                    "Fecha",
                                    "Mascota",
                                    "Exámenes",
                                    "Abono",
                                    "Valor total",
                                    "Saldo pendiente",
                                    "Estado"
                                ].map((header) => (
                                    <th key={header} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider whitespace-nowrap">{header}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {
                            pendientes.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-[#6B7A99] text-[13px]">
                                        No hay registros pendientes con esos filtros
                                    </td>
                                </tr>
                            )}

                            {
                                pendientes.map((orden) => (
                                    <tr key={orden.id} className="border-b border-[rgba(27,43,75,0.04)] hover:bg-[#F8FAFC] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-[#EAF9FB] flex items-center justify-center text-[#2BB5C3]">
                                                    <AlertTriangle size={14}/>
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-semibold text-[#1B2B4B]">
                                                        {orden.cliente || "Sin veterinaria"}
                                                    </p>
                                                    <p className="text-[10px] text-[#6B7A99]">
                                                        {orden.tipoServicio || "Sin tipo"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-[12px] font-bold text-[#1B2B4B]">
                                            {orden.numeroOrden || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-[12px] text-[#6B7A99] whitespace-nowrap">
                                            {orden.fecha || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-[12px] text-[#1B2B4B]">
                                            {orden.mascotaNombre || "—"}
                                        </td>

                                        <td className="px-4 py-3 text-[12px] text-[#6B7A99] max-w-70">
                                            <div className="line-clamp-3">
                                                {orden.exámenes || "Sin exámenes"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 text-[12px] font-semibold text-[#1B2B4B]">
                                            {formatMoney(orden.totalPagado)}
                                        </td>

                                        <td className="px-4 py-3 text-[12px] font-semibold text-[#1B2B4B]">
                                            {formatMoney(Number(orden.valorTotal || 0))}
                                        </td>

                                        <td className={`px-4 py-3 text-[12px] font-extrabold ${ orden.saldoPendiente > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {formatMoney(orden.saldoPendiente)}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${orden.estadoPago === "Pagado" ? "bg-emerald-100 text-emerald-700" : orden.estadoPago === "Pago parcial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                                {orden.estadoPago || "Pendiente por pago"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}