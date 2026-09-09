import { useState } from "react";
import type { Responsable } from "../../types";
import { Edit2, Eye, Plus, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import { IC } from "../../constants";


function Label({text, required}: {text: string; required?: boolean}) {
    return(
        <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
            {text} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}

const EMPTY_RESPONSABLE = (): Omit<Responsable, "id"> => ({
    nombre: "", usuario: "", correo: "", rol: "Responsable / Operador", estado: "Activo",
});

interface Props {
    responsables: Responsable[];
    onSave: (data: Omit<Responsable, "id">, id?: string) => void;
    onToggle: (id: string) => void;
}


export default function Manager({responsables, onSave, onToggle}: Props) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_RESPONSABLE());
    const [viewItem, setViewItem] = useState<Responsable | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const upd = (k: keyof typeof form, v: string) => setForm((f) => ({...f, [k]: v}));

    const openNew = () => {setForm(EMPTY_RESPONSABLE()); setEditingId(null); setErrors({}); setFormOpen(true);};
    const openEdit = (r: Responsable) => {
        setForm({nombre: r.nombre, usuario: r.usuario, correo: r.correo, rol: r.rol, estado: r.estado});
        setEditingId(r.id); setErrors({}); setFormOpen(true);
    };
    const closeForm = () => { setFormOpen(false); setEditingId(null); setForm(EMPTY_RESPONSABLE()); setErrors({});};

    const validate = () => {
        const e: Record<string, string> = {};
        if(!form.nombre.trim()) e.nombre = "Requerido";
        if(!form.usuario.trim()) e.usuario = "Requerido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if(!validate()) return;
        onSave(form, editingId ?? undefined);
        closeForm();
    };

    const visible = responsables.filter((r) => {
        const matchFilter = filter === "Todos" || r.estado === filter;
        const q = search.toLowerCase();
        const matchSearch = !search || r.nombre.toLowerCase().includes(q) || r.usuario.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const counts = {total: responsables.length, admins: responsables.filter((r) => r.rol === "Administrador").length, activos: responsables.filter((r) => r.estado === "Activo").length};

    const rolColor = (rol: string) => rol === "Administrador" ? "bg-[#1B2B4B]/10 text-[#1B2B4B]" : "bg-[#2BB5C3]/10 text-[#2BB5C3]";

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">Responsables</h1>
                    <p className="text-[13px] text-[#6B7A99] mt-0.5">Usuarios con acceso al sistema IRVET Control</p>
                </div>
                <button onClick={openNew} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43, 181, 195, 0.35)"}}>
                    <Plus size={15}/> Nuevo Responsable
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[["Total", counts.total, "#1B2B4B"], ["Activos", counts.activos, "#10b981"], ["Administradores", counts.admins, "#2BB5C3"]].map(([l, v, c]) => (
                    <div key={l as string} className="bg-white rounded-2xl p-4 border border-[rgba(27, 43, 75, 0.06)]" style={{boxShadow: "0 1px 6px rgba(27, 43, 75, 0.06)"}}>
                        <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">{l as string}</p>
                        <p className="text-[28px] font-extrabold mt-1" style={{color: c as string}}>{v as number}</p>
                    </div>
                ))}
            </div>

            {
                formOpen && (
                    <div className="bg-white rounded-2xl border border-[rgba(43, 181, 195, 0.25)] overflow-hidden" style={{boxShadow: "0 4px 20px rgba(43, 181, 195, 0.12)"}}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(27, 43, 75, 0.06)]" style={{background: "linear-gradient(135deg, #1B2B4B 0%, #243861 100%)"}}>
                            <h2 className="text-white font-extrabold text-[14px]">{editingId ? "Editar Responsable" : "Nuevo Responsable"}</h2>
                            <button onClick={closeForm} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"><X size={14}/></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label text="Nombre Completo" required/><input value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Ej: Gissel Ramírez" className={`${IC} ${errors.nombre ? "border-rose-400" : ""}`} />{errors.nombre && <p className="text-[11px] text-rose-500 mt-1">{errors.nombre}</p>}</div>
                                <div><Label text="Usuario / Nombre de Sistema" required/><input value={form.usuario} onChange={(e) => upd("usuario", e.target.value.toUpperCase())} placeholder="GISSEL" className={`${IC} uppercase font-mono ${errors.usuario ? "border-rose-400" : ""}`}/>{errors.usuario && <p className="text-[11px] text-rose-500 mt-1">{errors.usuario}</p>}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><Label text="Correo Electrónico"/><input type="email" value={form.correo} onChange={(e) => upd("correo", e.target.value)} placeholder="correo@irvet.com" className={IC} /></div>
                                <div>
                                    <Label text="Rol"/>
                                    <select value={form.rol} onChange={(e) => upd("rol", e.target.value as Responsable["rol"])} className={IC}>
                                        <option value="Representante Legal">Representante Legal</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Asistente Administrativo">Asistente Administrativo</option>
                                        <option value="Domiciliario multiservicios">Domiciliario multiservicios</option>
                                        <option value="Responsable / Operador">Responsable / Operador</option>
                                    </select>
                                </div>
                                <div>
                                    <Label text="Estado"/>
                                    <select value={form.estado} onChange={(e) => upd("estado", e.target.value as "Activo" | "Inactivo")} className={IC}>
                                        <option>Activo</option><option>Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button onClick={handleSave} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43, 181, 195, 0.35)"}}>Guardar</button>
                                <button onClick={closeForm} className="text-[13px] font-bold text-[#6B7A99] px-4 py-2.5 rounded-xl border border-[rgba(27,43,75,0.1)] hover:bg-gray-50 transition-colors">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-[rgba(27, 43, 75, 0.06)] oveflow-hidden" style={{boxShadow: "0 1px 6px rgba(27, 43, 75, 0.06)"}}>
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(27, 43, 75, 0.06)]">
                        <div className="relative flex-1 max-w-xs">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar responsable..." className={`${IC} pl-8`} />
                        </div>
                        <div className="flex gap-1 ml-auto">
                            {(["Todos", "Activo", "Inactivo"] as const).map((f) => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${filter === f ? "text-white" : "text-[#6B7A99] hover:bg-gray-100"}`} style={filter === f ? {background: "#2BB5C3"}: {}}></button>
                            ))}
                        </div>
                    </div>
                    <div className="overlfow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[rgba(27,43,75,0.06)]" style={{background: "#F8FAFC"}}>
                                    {["Nombre", "Usuario", "Correo", "Rol", "Estado", "Acciones"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    visible.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-12 text-[#6B7A99] text-[13px]">No se encontraron responsables</td></tr>
                                    )}
                                    {
                                        visible.map((r) => (
                                            <tr key={r.id} className="border-b border-[rgba(27,43,75,0.04)] hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-4 py-3"><p className="text-[13px] font-semibold text-[#1B2B4B]">{r.nombre}</p></td>
                                                <td className="px-4 py-3"><span className="text-[12px] font-mono font-bold bg-[#F4F7FA] text-[#1B2B4B] px-2 py-0.5 rounded-md">{r.usuario}</span></td>
                                                <td className="px-4 py-3 text-[13px] text-[#6B7A99]">{r.correo || "—"}</td>
                                                <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${rolColor(r.rol)}`}>{r.rol}</span></td>
                                                <td className="px-4 py-3"><span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${r.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{r.estado}</span></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setViewItem(r)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#E8F8FA] text-[#6B7A99] hover:text-[#2BB5C3] flex items-center justify-center transition-colors"><Eye size={13}/></button>
                                                        <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#EEF2F7] text-[#6B7A99] hover:text-[#1B2B4B] flex items-center justify-center transition-colors"><Edit2 size={13} /></button>
                                                        <button onClick={() => onToggle(r.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${r.estado === "Activo" ? "bg-amber-50 hover:bg-amber-100 text-amber-500" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-500"}`}>
                                                            {r.estado === "Activo" ? <ToggleLeft size={13}/> : <ToggleRight size={13}/>}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-3 border-t border-[rgba(27,43,75,0.06)]">
                        <p className="text-[11px] text-[#6B7A99]">{visible.length} de {responsables.length} responsables</p>
                    </div>
                </div>

                {
                    viewItem && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
                            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" style={{boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)"}} onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-5 py-4" style={{background: "linear-gradient(135deg, #1B2B4B 0%, #243861 100%)"}}>
                                    <h2 className="text-white font-extrabold text-[14px]">Detalle del Responsable</h2>
                                    <button onClick={() => setViewItem(null)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"><X size={14}/></button>
                                </div>
                                <div className="p-5 space-y-3">
                                    {[["Nombre", viewItem.nombre], ["Usuario", viewItem.usuario], ["Correo", viewItem.correo||"—"], ["Rol", viewItem.rol], ["Estado", viewItem.estado]].map(([k,v]) => (
                                        <div key={k} className="flex gap-3">
                                            <span className="text-[12px] font-bold text-[#6B7A99] w-24 shrink-0">{k}</span>
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