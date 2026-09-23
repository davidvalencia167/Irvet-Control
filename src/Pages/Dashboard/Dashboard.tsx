import { Activity, AlertTriangle, ArrowRight, BarChart3, ClipboardList, FolderKanban, ShieldUser, Stethoscope, Users, Wallet } from "lucide-react";
import type { ServicioCatalogo } from "../../constants/services";
import type { Cliente, Medico, Orden, Responsable } from "../../types";


interface DashboardAdminProps {
    ordenes: Orden[];
    clientes: Cliente[];
    medicos: Medico[];
    responsables: Responsable[];
    catalogo: Record<string, ServicioCatalogo[]>;
}

const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

export default function DashboardAdmin({ordenes, clientes, medicos, responsables, catalogo}: DashboardAdminProps) {
    const totalCatalogServicios = Object.values(catalogo).reduce(
        (sum, items) => sum + items.length,
        0
    );

    const totalClientesActivos = clientes.filter((c) => c.estado === "Activo").length;
    const totalMedicosActivos = medicos.filter((m) => m.estado === "Activo").length;
    const totalResponsablesActivos = responsables.filter((r) => r.estado === "Activo").length;

    const totalOrdenes = ordenes.length;
    const ordenesCompletadas = ordenes.filter((o) => o.estadoOrden === "Completada").length;
    const ordenesProceso = ordenes.filter((o) => o.estadoOrden === "En proceso").length;
    const ordenesPendientes = ordenes.filter((o) => o.estadoOrden === "Pendiente de recepción").length;

    const totalIngresos = ordenes.reduce((sum, orden) => {
        const pagos = (orden.pagos ?? []).reduce((acc, pago) => acc + Number(pago.valor || 0), 0);
        return sum + pagos;
    }, 0);

    const totalDeuda = ordenes.reduce((sum, orden) => {
        const totalPagado = (orden.pagos ?? []).reduce((acc, pago) => acc + Number(pago.valor ||0), 0);
        const total = Number(orden.valorTotal  || 0);
        return sum + Math.max(0, total - totalPagado);
    }, 0);

    const estados = [
        { label: "Completados", value: ordenesCompletadas, tone: "emerald"},
        { label: "En proceso", value: ordenesProceso, tone: "amber"},
        { label: "Pendientes", value: ordenesPendientes, tone: "rose"},
    ];

    const quickStats = [
        { label: "Ordenes", value: totalOrdenes, icon: Activity, color: "bg-[#EAF9FB] text-[#2BB5C3]"},
        { label: "Ingresos", value: formatMoney(totalIngresos), icon: Wallet, color: "bg-[#ECFDF5] text-[#10B981]"},
        { label: "Pendientes", value: formatMoney(totalDeuda), icon: AlertTriangle, color: "bg-[#FEE2E2] text-[#E11D48]"},
        { label: "Servicios", value: totalCatalogServicios, icon: BarChart3, color: "bg-[#FFF7ED] text-[#F59E0B]"}
    ];

    const modules = [
        { label: "Clientes", total: clientes.length, active: totalClientesActivos, icon: Users, color: "bg-[#EAF9FB] text-[#2BB5C3]"},
        { label: "Médicos", total: medicos.length, active: totalMedicosActivos, icon: Stethoscope, color: "bg-[#EEF2FF] text-[#5865F2]"},
        { label: "Responsables", total: responsables.length, active: totalResponsablesActivos, icon: ShieldUser, color: "bg-[#ECFDF5] text-[#10B981]"},
        { label: "Catálogo", total: totalCatalogServicios, active: totalCatalogServicios, icon: ClipboardList, color: "bg-[#FFF7ED] text-[#F59E0B]"},
    ];

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">
                        Dashboard general
                    </h1>
                    <p className="text-[13px] text-[#6B7A99] mt-0-5">
                        Resumen operativo del sistema IRVET
                    </p>
                </div>

                <div className="rounded-2xl border border-[#dfe9f5] bg-white px-4 py-2 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B7A99]">
                        Fecha
                    </p>
                    <p className="text-[16px] font-extrabold text-[#1B2B4B]">
                        {
                            new Date().toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {
                    quickStats.map((item) => (
                        <div key={item.label} className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                                    {item.label}
                                </p>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                                    <item.icon size={16}/>
                                </div>
                            </div>

                            <p className="text-[26px] font-extrabold mt-3 text-[#1B2B4B]">{item.value}</p>
                        </div>
                    ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                                Estado de órdenes
                            </p>
                            <h2 className="text-[18px] font-extrabold text-[#1B2B4B]">
                                Distribución por etapa
                            </h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#EAF9FB] text-[#2BB5C3] flex items-center justify-center">
                            <FolderKanban size={18}/>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {
                            estados.map((item) => {
                                const dotColor = item.tone === "emerald"
                                    ? "bg-emerald-500"
                                    : item.tone === "amber"
                                        ? "bg-amber-500"
                                        : "bg-rose-500";

                                return(
                                    <div key={item.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}/>
                                            <span className="text-[12px] text-[#6B7A99]">{item.label}</span>
                                        </div>
                                        <span className="text-[13px] font-bold text-[#1B2B4B]">{item.value}</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                                Módulos
                            </p>
                            <h2 className="text-[18px] font-extrabold text-[#1B2B4B] mt-1">
                                Registros activos
                            </h2>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#5865F2] flex items-center justify-center">
                            <ArrowRight size={18}/>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {
                            modules.map(({label, total, active, icon: Icon, color}) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(27, 43, 75, 0.06)]">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                                            <Icon size={14}/>
                                        </span>
                                        <span className="text-[12px] text-[#6B7A99]">{label}</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-[#1B2B4B]">
                                        {active}/{total}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Clientes activos
                    </p>
                    <p className="text-[28px] font-extrabold mt-2 text-[#1B2B4B]">
                        {totalClientesActivos}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Médicos activos
                    </p>
                    <p className="text-[28px] font-extrabold mt-2 text-[#1B2B4B]">
                        {totalMedicosActivos}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Responsables activos
                    </p>
                    <p className="text-[28px] font-extrabold mt-2 text-[#1B2B4B]">
                        {totalResponsablesActivos}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                    <h2 className="text-[18px] font-extrabold text-[#1B2B4B]">
                        Resumen financiero
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 p-5">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                            Total cobrado
                        </p>
                        <p className="text-[24px] font-extrabold text-emerald-700 mt-2">
                            {formatMoney(totalIngresos)}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                        <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                            Deuda pendiente
                        </p>
                        <p className="text-[24px] font-extrabold text-rose-700 mt-2">
                            {formatMoney(totalDeuda)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}