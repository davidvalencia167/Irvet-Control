import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { Orden, PaymentRow } from "../../types";
import { AlertTriangle, CalendarDays, Check, Filter, Plus, Search, X } from "lucide-react";
import { currentDate, IC, MEDIOS_PAGO } from "../../constants";
import { calculatePetServicesTotal } from "../../constants/services";

type FiltroEstado = "todos" | "pendiente" | "parcial" | "vencido";

const formatMoney = (value: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

type PetPending = {
    id: string;
    nombre: string;
    numeroOrden: string;
    examenes: string;
    valor: number;
    pagado: number;
    cubierto: number;
    saldo: number;
    pagos: PaymentRow[];
};

export default function Pendings({ordenes, onOrdenesChange}:{ordenes: Orden[]; onOrdenesChange: Dispatch<SetStateAction<Orden[]>>}) {
    const [search, setSearch] = useState("");
    const [veterinaria, setVeterinaria] = useState("Todas");
    const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("todos");
    const [paymentOrder, setPaymentOrder] = useState<Orden | null>(null);
    const [paymentPetId, setPaymentPetId] = useState("");
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentDate, setPaymentDate] = useState(currentDate());
    const [paymentConcept, setPaymentConcept] = useState("");

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
            const totalPagado = (orden.pagos ?? [])
            .filter((pago) => (pago.tipo ?? "Pago") === "Pago")
            .reduce((sum, pago) => sum + Number(pago.valor || 0), 0);

            const totalCubierto = (orden.pagos ?? []).reduce(
            (sum, pago) => sum + Number(pago.valor || 0),
            0
            );

            const totalOrden = Number(orden.valorTotal || 0);
            const saldoPendiente = Math.max(0, totalOrden - totalCubierto);

            const mascotaNombre = (orden.mascotas ?? [])
            .map((m) => m.nombre || "Sin nombre")
            .join(", ");

            const exámenes = (orden.mascotas ?? [])
            .flatMap((m) => m.servicios ?? [])
            .map((s) => s.descripcion)
            .join(", ");

            const detallePagos = (orden.pagos ?? [])
            .filter((pago) => pago.medio || pago.valor || pago.concepto)
            .map((pago) => {
                const mascota = (orden.mascotas ?? []).find(
                    (pet) => pet.id === pago.mascotaId,
                );
                const tipo = pago.tipo ?? "Pago";
                const descripcion = tipo === "Pago"
                    ? `${pago.medio || "Método sin definir"}: $${Number(pago.valor || 0).toLocaleString("es-CO")}`
                    : `${tipo}: $${Number(pago.valor || 0).toLocaleString("es-CO")}`;
                return `${mascota?.nombre || "Orden"} - ${descripcion}${pago.fecha ? ` · ${pago.fecha}` : ""}${pago.concepto ? ` (${pago.concepto})` : ""}`;
            })
            .join(" | ");

            const numeroOrden = orden.numeroOrden || (orden.mascotas ?? [])
                .map((mascota) => mascota.numeroOrden.trim())
                .filter(Boolean)
                .join(", ");

            const mascotasDetalle: PetPending[] = (orden.mascotas ?? []).map((mascota) => {
                const pagos = (orden.pagos ?? []).filter((pago) => pago.mascotaId === mascota.id);
                const valor = calculatePetServicesTotal(mascota.servicios ?? []);
                const pagado = pagos
                    .filter((pago) => (pago.tipo ?? "Pago") === "Pago")
                    .reduce((sum, pago) => sum + Number(pago.valor || 0), 0);
                const cubierto = pagos.reduce((sum, pago) => sum + Number(pago.valor || 0), 0);
                return {
                    id: mascota.id,
                    nombre: mascota.nombre || "Sin nombre",
                    numeroOrden: mascota.numeroOrden || numeroOrden || "Sin número",
                    examenes: mascota.servicios?.map((servicio) => servicio.descripcion).join(", ") || "Sin exámenes",
                    valor,
                    pagado,
                    cubierto,
                    saldo: Math.max(0, valor - cubierto),
                    pagos,
                };
            });

            return {
            ...orden,
            numeroOrden,
            totalPagado,
            totalCubierto,
            saldoPendiente,
            mascotaNombre,
            exámenes: exámenes || "Sin exámenes",
            detallePagos: detallePagos || "Sin pagos registrados",
            mascotasDetalle,
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
                orden.detallePagos,
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
    const openPayment = (orden: Orden, petId = "") => {
        const pet = orden.mascotas.find((item) => item.id === petId) ?? orden.mascotas[0];
        const petPayments = pet ? orden.pagos.filter((pago) => pago.mascotaId === pet.id) : [];
        const value = pet
            ? Math.max(0, calculatePetServicesTotal(pet.servicios) - petPayments.reduce((sum, pago) => sum + Number(pago.valor || 0), 0))
            : Math.max(0, Number(orden.valorTotal || 0) - orden.pagos.reduce((sum, pago) => sum + Number(pago.valor || 0), 0));
        setPaymentOrder(orden);
        setPaymentPetId(pet?.id ?? "");
        setPaymentAmount(String(value));
        setPaymentMethod("");
        setPaymentDate(currentDate());
        setPaymentConcept("");
    };
    const closePayment = () => setPaymentOrder(null);
    const savePayment = () => {
        if (!paymentOrder || !paymentAmount || Number(paymentAmount) <= 0 || !paymentMethod || !paymentDate) return;
        const payment: PaymentRow = {
            id: crypto.randomUUID(),
            tipo: "Pago",
            medio: paymentMethod,
            valor: paymentAmount,
            fecha: paymentDate,
            mascotaId: paymentPetId,
            concepto: paymentConcept,
        };
        onOrdenesChange((current) => current.map((orden) => {
            if (orden.id !== paymentOrder.id) return orden;
            const pagos = [...(orden.pagos ?? []), payment];
            const total = Number(orden.valorTotal || 0);
            const cubierto = pagos.reduce((sum, pago) => sum + Number(pago.valor || 0), 0);
            return {
                ...orden,
                pagos,
                estadoPago: total > 0 && cubierto >= total ? "Pagado" : cubierto > 0 ? "Pago parcial" : "Pendiente por pago",
            };
        }));
        closePayment();
    };

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
                                    "Servicios y valor",
                                    "Pagado",
                                    "Valor total",
                                    "Saldo pendiente",
                                    "Estado",
                                    "Acción"
                                ].map((header) => (
                                    <th key={header} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider whitespace-nowrap">{header}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {
                            pendientes.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="text-center py-12 text-[#6B7A99] text-[13px]">
                                        No hay registros pendientes con esos filtros
                                    </td>
                                </tr>
                            )}

                            {
                                pendientes.flatMap((orden) => {
                                    const pets = orden.mascotasDetalle.length > 0
                                        ? orden.mascotasDetalle
                                        : [{
                                        id: `${orden.id}-sin-mascota`,
                                        nombre: "Sin mascota",
                                        numeroOrden: orden.numeroOrden || "—",
                                        examenes: orden.exámenes,
                                        valor: Number(orden.valorTotal || 0),
                                        pagado: orden.totalPagado,
                                        cubierto: orden.totalCubierto,
                                        saldo: orden.saldoPendiente,
                                        pagos: orden.pagos,
                                        }];

                                    return pets.map((pet, petIndex) => (
                                        <tr key={`${orden.id}-${pet.id}`} className="border-b border-[rgba(27,43,75,0.04)] hover:bg-[#F8FAFC] transition-colors">
                                        {petIndex === 0 && (
                                            <>
                                                <td rowSpan={pets.length} className="px-4 py-3 align-top">
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-8 h-8 rounded-xl bg-[#EAF9FB] flex items-center justify-center text-[#2BB5C3] shrink-0">
                                                            <AlertTriangle size={14}/>
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-semibold text-[#1B2B4B]">{orden.cliente || "Sin veterinaria"}</p>
                                                            <p className="text-[10px] text-[#6B7A99]">{orden.tipoServicio || "Sin tipo"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td rowSpan={pets.length} className="px-4 py-3 align-top text-[12px] font-bold text-[#1B2B4B]">
                                                    {orden.numeroOrden || pets.map((item) => item.numeroOrden).join(", ") || "—"}
                                                </td>
                                                <td rowSpan={pets.length} className="px-4 py-3 align-top text-[12px] text-[#6B7A99] whitespace-nowrap">
                                                    {orden.fecha || "—"}
                                                </td>
                                            </>
                                        )}

                                        <td className="px-4 py-3 align-top text-[12px] text-[#1B2B4B]">
                                            <p className="font-extrabold">{pet.nombre}</p>
                                            <p className="text-[10px] text-[#6B7A99]">Orden {pet.numeroOrden}</p>
                                        </td>
                                        <td className="px-4 py-3 align-top text-[11px] text-[#1B2B4B] min-w-55">
                                            <p>{pet.examenes}</p>
                                            <p className="font-bold text-[#1B2B4B] mt-1">Valor: {formatMoney(pet.valor)}</p>
                                        </td>
                                        <td className="px-4 py-3 align-top text-[12px] font-semibold text-[#1B2B4B]">
                                            <p className="text-emerald-700">{formatMoney(pet.pagado)}</p>
                                            {pet.cubierto > pet.pagado && <p className="text-[10px] text-blue-700">Promoción: {formatMoney(pet.cubierto - pet.pagado)}</p>}
                                        </td>
                                        {petIndex === 0 && (
                                            <>
                                                <td rowSpan={pets.length} className="px-4 py-3 align-top text-[12px] font-semibold text-[#1B2B4B]">
                                                    {formatMoney(Number(orden.valorTotal || 0))}
                                                </td>
                                                <td rowSpan={pets.length} className={`px-4 py-3 align-top text-[12px] font-extrabold ${orden.saldoPendiente > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {formatMoney(orden.saldoPendiente)}
                                                </td>
                                                <td rowSpan={pets.length} className="px-4 py-3 align-top">
                                                    <span className={`inline-block text-center text-[11px] font-bold px-2.5 py-1 rounded-full ${orden.estadoPago === "Pagado" ? "bg-emerald-100 text-emerald-700" : orden.estadoPago === "Pago parcial" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                                        {orden.estadoPago || "Pendiente por pago"}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-4 py-3 align-top">
                                            <button type="button" onClick={() => openPayment(orden, pet.id.includes("-sin-mascota") ? undefined : pet.id)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#2BB5C3] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#239aa6]">
                                                <Plus size={12} /> Ingresar pago
                                            </button>
                                        </td>
                                        </tr>
                                    ));
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
            {paymentOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B2B4B]/55 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between rounded-t-2xl bg-[#1B2B4B] px-5 py-4">
                            <div>
                                <h2 className="text-[15px] font-extrabold text-white">Ingresar pago</h2>
                                <p className="text-[11px] text-white/60">{paymentOrder.cliente} · {paymentOrder.factura}</p>
                            </div>
                            <button type="button" onClick={closePayment} className="text-white/80 hover:text-white"><X size={18} /></button>
                        </div>
                        <div className="space-y-4 p-5">
                            <div>
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]">Mascota</label>
                                <select value={paymentPetId} onChange={(event) => {
                                    const petId = event.target.value;
                                    const pet = paymentOrder.mascotas.find((item) => item.id === petId);
                                    const covered = pet ? paymentOrder.pagos.filter((pago) => pago.mascotaId === petId).reduce((sum, pago) => sum + Number(pago.valor || 0), 0) : 0;
                                    setPaymentPetId(petId);
                                    setPaymentAmount(pet ? String(Math.max(0, calculatePetServicesTotal(pet.servicios) - covered)) : "");
                                }} className={IC}>
                                    {paymentOrder.mascotas.map((pet) => <option key={pet.id} value={pet.id}>{pet.nombre || "Sin nombre"} · Orden {pet.numeroOrden || "Sin número"}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]">Valor recibido</label><input type="number" min="1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} className={IC} /></div>
                                <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]">Método</label><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={IC}><option value="">Seleccionar...</option>{MEDIOS_PAGO.map((medio) => <option key={medio} value={medio}>{medio}</option>)}</select></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]"><CalendarDays size={12} /> Fecha del pago</label><input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className={IC} /></div>
                                <div><label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6B7A99]">Concepto</label><input value={paymentConcept} onChange={(event) => setPaymentConcept(event.target.value)} placeholder="Ej: Abono pendiente" className={IC} /></div>
                            </div>
                            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                                <button type="button" onClick={closePayment} className="rounded-xl bg-gray-100 px-4 py-2 text-[12px] font-bold text-gray-600">Cancelar</button>
                                <button type="button" disabled={!paymentAmount || Number(paymentAmount) <= 0 || !paymentMethod} onClick={savePayment} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2BB5C3] px-4 py-2 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><Check size={14} /> Guardar pago</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}