import { useState } from "react";
import type { Medico } from "../../types";
import { Edit2, Eye, Plus, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import { IC } from "../../constants";

function Label({text, required}: {text: string; required?: boolean}) {
    return(
        <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
            {text} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

const EMPTY_MEDICO = (): Omit<Medico, "id"> => ({
    nombre: "", matricula: "", telefono: "", correo: "", clinica:"", fechaCumpleanos: "", estado: "Activo", observaciones:"",
});

function fmtCumpleanos(d: string) {
    if(!d) return null;
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es-CO", {day: "numeric", month: "long"});
}

function diasParaCumpleanos(d: string): number | null {
    if(!d) return null;
    const today = new Date();
    const bday = new Date(d + "T00:00:00");
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if(next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next.getTime() - today.getTime())/  86_400_000);
}

interface Props {
    medicos: Medico[];
    onSave: (data: Omit<Medico, "id">, id?: string) => void;
    onToggle: (id: string) => void;
}

export default function Veterinary({medicos, onSave, onToggle} : Props) {
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_MEDICO());
    const [viewItem, setViewItem] = useState<Medico | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const upd = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const openNew = () => {setForm(EMPTY_MEDICO()); setEditingId(null); setErrors({}); setFormOpen(true);}
    const openEdit = (m: Medico) => {
        setForm({nombre: m.nombre, matricula: m.matricula, telefono: m.telefono, correo: m.correo, clinica: m.clinica, fechaCumpleanos: m.fechaCumpleanos, estado: m.estado, observaciones: m.observaciones});
        setEditingId(m.id); setErrors({}); setFormOpen(true);
    };
    const closeForm = () => {setFormOpen(false); setEditingId(null); setForm(EMPTY_MEDICO()); setErrors({});};

    const validate = () => {
        const e: Record<string, string> = {};
        if(!form.nombre.trim()) e.nombre = "Requerido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if(!validate()) return;
        onSave(form, editingId ?? undefined);
        closeForm();
    };

    const visible = medicos.filter((m) => {
        const q = search.toLowerCase();
        return !search || m.nombre.toLowerCase().includes(q) || m.matricula.toLowerCase().includes(q) || m.clinica.toLowerCase().includes(q);
    });

    const counts = {
        total: medicos.length,
        activos: medicos.filter((m) => m.estado === "Activo").length,
        conCumple: medicos.filter((m) => m.fechaCumpleanos).length,
    };

    const proximosCumples = medicos
        .filter((m) => m.fechaCumpleanos)
        .map((m) => ({...m, dias: diasParaCumpleanos(m.fechaCumpleanos)!}))
        .filter((m) => m.dias <= 30)
        .sort((a, b) => a.dias - b.dias);

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">Médicos Veterianrios</h1>
                    <p className="text-[13px] text-[#6B7A99] mt-0.5">Médicos remitentes y sus fechas de cumpleaños</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43, 181, 195, 0.35)"}}>
                    <Plus size={15}/> Nuevo Médico
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {([["Total registrados", counts.total, "#1B2B4B"], ["Activos", counts.activos, "#10b981"], ["Con cumpleaños", counts.conCumple, "#E8449A"]] as const).map(([l, v, c]) => (
                    <div key={l} className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)]" style={{boxShadow: "0 1px 6px rgba(27, 43, 75, 0.06)"}}>
                        <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">{l}</p>
                        <p className="text-[28px] font-extrabold mt-1" style={{color: c}}>{v}</p>
                    </div>
                ))}
            </div>

            {
                proximosCumples.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[rgba(232, 68, 154, 0.2)] p-4 overflow-hidden" style={{boxShadow: "0 1px 6px rgba(232, 68, 154, 0.08)"}}>
                        <p className="text-[11px] font-bold text-[#E8449A] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>🎂</span> Próximos cumpleaños (próximos 30 dias)
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {
                                proximosCumples.map((m) => (
                                    <div key={m.id} className="flex items-center gap-2.5 bg-[#FDF0F7] border border-[rgba(232, 68, 154, 0.15)] rounded-xl px-3 py-2">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{background: "#E8449A"}}>
                                            {m.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-[#1B2B4B]">{m.nombre}</p>
                                            <p className="text-[10px] text-[#6B7A99]">{fmtCumpleanos(m.fechaCumpleanos)} · {m.dias === 0 ? "¡Hoy! 🎉" : `en ${m.dias} día${m.dias !== 1 ? "s" : ""}`}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {
                    formOpen && (
                        <div className="bg-white rounded-2xl border border-[rgba(43, 181, 195, 0.25)] overflow-hidden" style={{boxShadow: "0 4px 20px rgba(43, 181, 195, 0.12)"}}>
                            <div className="flex items-center justify-between px-5 py-4" style={{background: "linear-gradient(135deg, #1B2B4B 0%, #243861 100%)"}}>
                                <h2 className="text-white font-extrabold text-[14px]">{editingId ? "Editar Médico" : "Nuevo Médico Veterinario"}</h2>
                                <button onClick={closeForm} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"><X size={14}/></button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-5 gap-4">
                                    <div className="col-span-4">
                                        <Label text="Nombre Completo" required/>
                                        <input value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Dr. Juan Pérez Rodríguez" className={`${IC} ${errors.nombre ? "border-rose-400" : ""}`} />
                                        {errors.nombre && <p className="text-[11px] text-rose-500 mt-1">{errors.nombre}</p>}
                                    </div>
                                    <div>
                                        <Label text="Matricula"/>
                                        <input value={form.matricula} onChange={(e) => upd("matricula", e.target.value)} placeholder="12345" maxLength={8} className={IC} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 gap-4">
                                    <div>
                                        <Label text="Teléfono"/>
                                        <input value={form.telefono} onChange={(e) => upd("telefono", e.target.value)} placeholder="3001234567" className={IC} />
                                    </div>
                                    <div className="col-span-3">
                                        <Label text="Correo Electrónico"/>
                                        <input type="email" value={form.correo} onChange={(e) => upd("correo", e.target.value)} placeholder="medico@clinica.com" className={IC} />
                                    </div>
                                    <div className="col-span-2">
                                        <Label text="Fecha de Cumpleaños"/>
                                        <input type="date" value={form.fechaCumpleanos} onChange={(e) => upd("fechaCumpleanos", e.target.value)} className={IC}/>
                                        {
                                        
                                        form.fechaCumpleanos && (
                                            <p className="text-[10px] text-[#E8449A] mt-1 font-medium">
                                                🎂 {fmtCumpleanos(form.fechaCumpleanos)}
                                                {diasParaCumpleanos(form.fechaCumpleanos) !== null && ` · en ${diasParaCumpleanos(form.fechaCumpleanos)} días`}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label text="Clínica / Consultorio"/><input value={form.clinica} onChange={(e) => upd("clinica", e.target.value)} placeholder="Clínica Veterinaria XYZ" className={IC}/></div>
                                    <div><Label text="Observaciones"/><input value={form.observaciones} onChange={(e) => upd("observaciones", e.target.value)} placeholder="Notas adicionales..." className={IC} /></div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <button onClick={handleSave} className="text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43, 181, 195, 0.35)"}}>Guardar</button>
                                    <button onClick={closeForm} className="text-[13px] font-bold text-[#6B7A99] px-4 py-2.5 rounded-xl border border-[rgba(27,43,75,0.1)] hover:bg-gray-50 transition-colors">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] overflow-hidden" style={{boxShadow: "0 1px 6px rgba(27,43,75,0.06)"}}>
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar médico, matrícula, clínica..." className={`${IC} pl-8`} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[rgba(27,43,75,0.06)]" style={{background: "#F8FAFC"}}>
                                        {["Nombre", "Matr.", "Clínica / Consultorio", "Teléfono", "Correo", "Fecha de Cumpleaños", ""].map((h) => (
                                            <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        visible.length === 0 && (
                                            <tr><td colSpan={7} className="text-center py-12 text-[#6B7A99] text-[13px]">No se encontraron médicos. Agrega el primero.</td></tr>
                                        )}
                                        {
                                            visible.map((m) => {
                                                const dias = diasParaCumpleanos(m.fechaCumpleanos);
                                                const esCumple = dias === 0;
                                                const pronto = dias !== null && dias <= 7;
                                                return(
                                                    <tr key={m.id} className={`border-b border-[rgba(27, 43, 75, 0.04)] transition-colors ${esCumple ? "bg-[#FDF0F7]" : "hover:bg-[#F8FAFC]"}`}>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{background: "#1B2B4B"}}>{m.nombre.charAt(0)}</div>
                                                                <div>
                                                                    <p className="text-[13px] font-semibold text-[#1B2B4B]">{m.nombre}</p>
                                                                    {esCumple && <p className="text-[10px] text-[#E8449A] font-bold">🎉 ¡Cumpleaños hoy!</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td  className="px-4 py-3">
                                                            <span className="text-[11px] font-mono font-bold bg-[#F4F7FA] text-[#1B2B4B] px-1.5 py-0.5 rounded">{m.matricula || "—"}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-[13px] text-[#6B7A99]">{m.clinica || "—"}</td>
                                                        <td className="px-4 py-3 text-[12px] text-[#6B7A99] whitespace-nowrap">{m.telefono || "—"}</td>
                                                        <td className="px-4 py-3 text-[12px] text-[#6B7A99]">{m.correo || "—"}</td>
                                                        <td className="px-4 py-3">
                                                            {
                                                                m.fechaCumpleanos ? (
                                                                    <div>
                                                                        <p className="text-[13px] font-semibold text-[#1B2B4B]">{fmtCumpleanos(m.fechaCumpleanos)}</p>
                                                                        {
                                                                            dias !== null && (
                                                                                <p className={`text-[10px] font-bold mt-0.5 ${esCumple ? "text-[#E8449A]" : pronto ? "text-amber-500" : "text-[#6B7A99]"}`}>
                                                                                    {esCumple ? "🎉 ¡Hoy!" : pronto ? `⏰ en ${dias} días` : `en ${dias} días`}
                                                                                </p>
                                                                            )}
                                                                    </div>
                                                                ) : <span className="text-[#6B7A99] text-[12px]">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => setViewItem(m)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#E8F8FA] text-[#6B7A99] hover:text-[#2BB5C3] flex items-center justify-center transition-colors" title="Ver"><Eye size={13}/></button>
                                                                <button onClick={() => openEdit(m)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#EEF2F7] text-[#6B7A99] hover:text-[#1B2B4B] flex items-center justify-center transition-colors" title="Editar"><Edit2 size={13}/></button>
                                                                <button onClick={() => onToggle(m.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${m.estado === "Activo" ? "bg-amber-50 hover:bg-amber-100 text-amber-500" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-500"}`} title={m.estado === "Activo" ? "Desactivar" : "Activar"}>
                                                                    {m.estado === "Activo" ? <ToggleLeft size={13}/> : <ToggleRight size={13}/>}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-[rgba(27, 43, 75, 0.06)]">
                            <p className="text-[11px] text-[#6B7A99]">{visible.length} de {medicos.length} médicos</p>
                        </div>
                    </div>

                    {
                        viewItem && (
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
                                <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{boxShadow: "0 20px 60px rgba(0,0,0,0.2)"}} onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between px-5 py-4" style={{background: "linear-gradient(135deg,#1B2B4B 0%,#243861 100%)"}}>
                                        <h2 className="text-white font-extrabold text-[14px]">Detalle del Médico</h2>
                                        <button onClick={() => setViewItem(null)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"><X size={14}/></button>
                                    </div>
                                    <div className="p-5 space-y-2.5">
                                        {[
                                            ["Nombre", viewItem.nombre],
                                            ["Matricula", viewItem.matricula || "—"],
                                            ["Clinica", viewItem.clinica || "—"],
                                            ["Teléfono", viewItem.telefono || "—"],
                                            ["Correo", viewItem.correo || "—"],
                                            ["Cumpleaños", viewItem.fechaCumpleanos ? `${fmtCumpleanos(viewItem.fechaCumpleanos)} (en ${diasParaCumpleanos(viewItem.fechaCumpleanos)} días)` : "—"],
                                            ["Estado", viewItem.estado],
                                            ["Observaciones", viewItem.observaciones || "—"],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex gap-3">
                                                <span className="text-[12px] font-bold text-[#6B7A99] w-28 shrink-0">{k}</span>
                                                <span className="text-[13px] text-[#1B2B4B] font-medium">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
        </div>
    );
}