import { useMemo, useState } from "react";
import type { ComboCatalogo, ServicioCatalogo } from "../../constants/services";
import { Plus, Trash2, X } from "lucide-react";

interface CombosProps {
    combos: ComboCatalogo[];
    catalogo: Record<string, ServicioCatalogo[]>;
    onAdd: (combo: ComboCatalogo) => void;
    onDelete: (id: string) => void;
}

const formatMoney = (value: number) =>
    `$${value.toLocaleString("es-CO")}`;


export default function Combos({combos, catalogo, onAdd, onDelete}: CombosProps) {
    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState<ServicioCatalogo[]>([]);
    const [error, setError] = useState("");

    const serviciosDisponibles = useMemo(
        () =>
            Object.values(catalogo)
                .flat()
                .filter((service) => service.categoria !== "Paquete"),
        [catalogo]
    );

    const precioIndividual = serviciosSeleccionados.reduce(
        (sum, servicio) => sum + servicio.precio,
        0
    );

    const ahorro = Math.max(
        0,
        precioIndividual - Number(precio || 0)
    );

    const toggleServicio = (servicio: ServicioCatalogo) => {
        const yaSeleccionado = serviciosSeleccionados.some(
            (item) => item.nombre === servicio.nombre
        );

        if (yaSeleccionado) {
            setServiciosSeleccionados((actuales) =>
                actuales.filter((item) => item.nombre !== servicio.nombre)
            );
            return;
        }

        setServiciosSeleccionados((actuales) => [...actuales, servicio]);
    };

    const limpiarFormulario = () => {
        setNombre("");
        setPrecio("");
        setServiciosSeleccionados([]);
        setError("");
    };

    const handleAdd = () => {
        const nombreCombo = nombre.trim();
        const precioCombo = Number(precio);

        if(!nombreCombo) {
            setError("Escribe el nombre del combo.");
            return;
        }

        if (serviciosSeleccionados.length === 0) {
            setError("Selecciona al menos un servicio o examen.");
            return;
        }

        if (!precioCombo || precioCombo <= 0) {
            setError("Escribe un precio válido para el combo.");
            return;
        }

        onAdd({
            id: crypto.randomUUID(),
            nombre: nombreCombo,
            servicios: serviciosSeleccionados,
            precio: precioCombo,
        });

        limpiarFormulario();
    };

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
                <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">
                    Combos
                </h1>
                <p className="text-[13px] text-[#6B7A99] mt-0.5">
                    Crea paquetes de servicios y exámenes para ofrecerlos como una sola opción
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Combos registrados
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-[#1B2B4B]">
                        {combos.length}
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Servicios seleccionados
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-[#2BB5C3]">
                        {serviciosSeleccionados.length}
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-[rgba(27,43,75,0.06)] p-4 shadow-sm">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                        Ahorro actual
                    </p>
                    <p className="text-[28px] font-extrabold mt-1 text-emerald-600">
                        {formatMoney(ahorro)}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-6 shadow-sm">
                <h2 className="text-[16px] font-extrabold text-[#1B2B4B]">
                    Agregar nuevo combo
                </h2>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
                            Nombre del combo
                        </label>
                        <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej: Perfil renal básico" className="w-full px-3 py-2 text-sm bg-[#F4F7FA] border border-[rgba(27,43,75,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25" />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
                            Precio del combo
                        </label>
                        <input type="number" min="1" value={precio} onChange={(event) => setPrecio(event.target.value)} placeholder="Ej: 50000" className="w-full px-3 py-2 text-sm bg-[#F4F7FA] border border-[rgba(27,43,75,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25" />
                    </div>
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">
                            Servicios y exámenes incluidos
                        </label>

                        <span className="text-[11px] font-bold text-[#2BB5C3]">
                            {serviciosSeleccionados.length} seleccionados
                        </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-xl bg-[#F8FAFC] p-3">
                        {
                            serviciosDisponibles.map((servicio) => {
                                const seleccionado = serviciosSeleccionados.some(
                                    (item) => item.nombre === servicio.nombre
                                );

                                return(
                                    <label key={`${servicio.categoria}-${servicio.nombre}`} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${seleccionado ? "border-[#2BB5C3] bg-[#EAF9FB]" : "border-transparent bg-white hover:border-[#d7e8eb]"}`}>
                                        <input type="checkbox" checked={seleccionado} onChange={() => toggleServicio(servicio)} className="mt-1 accent-[#2BB5C3]" />

                                        <span className="flex-1">
                                            <span className="block text-[12px] font-semibold text-[#1B2B4B]">
                                                {servicio.nombre}
                                            </span>
                                            <span className="block text-[11px] text-[#6B7A99] mt-0.5">
                                                {servicio.categoria} · {formatMoney(servicio.precio)}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                    </div>
                </div>

                {
                    serviciosSeleccionados.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="rounded-xl bg-[#F8FAFC] p-3">
                                <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
                                    Precio individual
                                </p>
                                <p className="text-[16px] font-extrabold text-[#1B2B4B] mt-1">
                                    {formatMoney(precioIndividual)}
                                </p>
                            </div>

                            <div className="rounded-xl bg-[#EAF9FB] p-3">
                                <p className="text-[10px] font-bold text-[#2BB5C3] uppercase">
                                    Precio combo
                                </p>
                                <p className="text-[16px] font-extrabold text-[#2BB5C3] mt-1">
                                    {formatMoney(Number(precio || 0))}
                                </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                                    Ahorro
                                </p>
                                <p className="text-[16px] font-extrabold text-emerald-600 mt-1">
                                    {formatMoney(ahorro)}
                                </p>
                            </div>
                        </div>
                    )}

                    {
                        error && (
                            <p className="text-[12px] text-rose-500 mt-3">
                                {error}
                            </p>
                        )}

                    <div className="flex items-center gap-3 mt-5">
                        <button type="button" onClick={handleAdd} className="flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl" style={{background: "#2BB5C3"}}>
                            <Plus size={15}/>
                            Agregar combo
                        </button>

                        <button type="button" onClick={limpiarFormulario} className="flex items-center gap-2 text-[13px] font-bold text-[#6B7A99] px-4 py-2.5 rounded-xl border border-[rgba(27,43,75,0.1)]">
                            <X size={14}/>
                            Limpiar
                        </button>
                    </div>
            </div>

            <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] p-6 shadow-sm">
                <h2 className="text-[16px] font-extrabold text-[#1B2B4B] mb-4">
                    Combos registrados
                </h2>

                {
                    combos.length === 0 ? (
                        <p className="text-[13px] text-[#6B7A99] text-center py-8">
                            Todavía no hay combos registrados.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {
                                combos.map((combo) => {
                                    const precioIndividualCombo = combo.servicios.reduce(
                                        (sum, servicio) => sum + servicio.precio,
                                        0
                                    );

                                    const ahorroCombo = Math.max(
                                        0,
                                        precioIndividualCombo - combo.precio
                                    );

                                    return(
                                        <div key={combo.id} className="rounded-2xl border border-[rgba(27, 43, 75, 0.08)] p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-[15px] font-extrabold text-[#1B2B4B]">
                                                        {combo.nombre}
                                                    </h3>
                                                    <p className="text-[11px] text-[#6B7A99] mt-1">
                                                        {combo.servicios.length} servicios incluidos
                                                    </p>
                                                </div>

                                                <button type="button" title="Eliminar combo" onClick={() => onDelete(combo.id)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                {
                                                    combo.servicios.map((servicio) => (
                                                        <div key={`${combo.id}-${servicio.nombre}`} className="flex items-center justify-between gap-3 text-[12px]">
                                                            <span className="text-[#6B7A99]">
                                                                {servicio.nombre}
                                                            </span>
                                                            <span className="font-semibold text-[#1B2B4B]">
                                                                {formatMoney(servicio.precio)}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-[rgba(27, 43, 75, 0.06)] flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
                                                        Precio combo
                                                    </p>
                                                    <p className="text-[20px] font-extrabold text-[#2BB5C3]">
                                                        {formatMoney(combo.precio)}
                                                    </p>
                                                </div>

                                                {
                                                    ahorroCombo > 0 && (
                                                        <span className="text-[11px] font-bold text-emerald-600">
                                                            Ahorra {formatMoney(ahorroCombo)}
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
            </div>
        </div>
    );
}