import { ChevronDown, Edit2, Eye, Plus, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import type { Cliente } from "../../types";
import { useState } from "react";
import { IC } from "../../constants";

function Label ({text, required} : {text: string; required?: boolean}) {
    return(
        <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
            {text} {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
    );
}


const EMPTY_CLIENTE = (): Omit<Cliente, "id"> => ({
  nombre: "", nit: "", representanteLegal: "",
  direccion: "", telefono: "", correo: "", aniversario: "",
  estado: "Activo", observaciones: "",
});

interface Props {
    clientes: Cliente[];
    onSave: (data: Omit<Cliente, "id">, id?: string) => void;
    onToggle: (id: string) => void;
}

export default function Clients({clientes, onSave, onToggle} : Props) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"Todos" | "Activo" | "Inactivo">("Todos");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_CLIENTE());
    const [viewItem, setViewItem] = useState<Cliente | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const upd = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

    const openNew = () => {setForm(EMPTY_CLIENTE()); setEditingId(null); setErrors({}); setFormOpen(true);};
    const openEdit = (c: Cliente) => { setForm({      nombre: c.nombre, nit: c.nit, representanteLegal: c.representanteLegal, direccion: c.direccion, telefono: c.telefono, correo: c.correo, aniversario: c.aniversario, estado: c.estado, observaciones: c.observaciones,}); setEditingId(c.id); setErrors({}); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setEditingId(null); setForm(EMPTY_CLIENTE()); setErrors({}); };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.nombre.trim()) e.nombre = "Requerido";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave(form, editingId ?? undefined);
        closeForm();
    };

    const visible = clientes.filter((c) => {
        const matchFilter = filter === "Todos" || c.estado === filter;
        const q = search.toLowerCase();
        const matchSearch = !search || c.nombre.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const counts = { total: clientes.length, activos: clientes.filter((c) => c.estado === "Activo").length, inactivos: clientes.filter((c) => c.estado === "Inactivo").length };

    const fmtAniversario = (d: string) => {
        if (!d) return "—";
        const [, m, day] = d.split("-");
        return `${day}/${m}`;
  };

    return(
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#1B2B4B] tracking-tight">Clientes</h1>
          <p className="text-[13px] text-[#6B7A99] mt-0.5">Clínicas y veterinarios remitentes</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{ background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43,181,195,0.35)" }}>
          <Plus size={15} /> Nuevo Cliente
        </button>
      </div>

      
      <div className="grid grid-cols-3 gap-4">
        {([["Total", counts.total, "#1B2B4B"], ["Activos", counts.activos, "#10b981"], ["Inactivos", counts.inactivos, "#f59e0b"]] as const).map(([l, v, c]) => (
          <div key={l} className="bg-white rounded-2xl p-4 border border-[rgba(27,43,75,0.06)]" style={{ boxShadow: "0 1px 6px rgba(27,43,75,0.06)" }}>
            <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">{l}</p>
            <p className="text-[28px] font-extrabold mt-1" style={{ color: c }}>{v}</p>
          </div>
        ))}
      </div>

      
      {formOpen && (
        <div className="bg-white rounded-2xl border border-[rgba(43,181,195,0.25)] overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(43,181,195,0.12)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg,#1B2B4B 0%,#243861 100%)" }}>
            <h2 className="text-white font-extrabold text-[14px]">{editingId ? "Editar Cliente" : "Nuevo Cliente"}</h2>
            <button onClick={closeForm} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"><X size={14} /></button>
          </div>
          <div className="p-5 space-y-4">

            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Nombre / Razón Social" required />
                <input value={form.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Ej: Clinivet S.A.S" className={`${IC} ${errors.nombre ? "border-rose-400" : ""}`} />
                {errors.nombre && <p className="text-[11px] text-rose-500 mt-1">{errors.nombre}</p>}
              </div>
              <div><Label text="NIT" /><input value={form.nit} onChange={(e) => upd("nit", e.target.value)} placeholder="900.123.456-7" className={IC} /></div>
            </div>

            
            <div className="grid grid-cols-2 gap-4">
              <div><Label text="Representante Legal" /><input value={form.representanteLegal} onChange={(e) => upd("representanteLegal", e.target.value)} placeholder="Nombre completo del representante" className={IC} /></div>
              <div><Label text="Dirección" /><input value={form.direccion} onChange={(e) => upd("direccion", e.target.value)} placeholder="Calle 45 # 12-30, Bogotá" className={IC} /></div>
            </div>

            
            <div className="grid grid-cols-4 gap-4">
              <div><Label text="Teléfono" /><input value={form.telefono} onChange={(e) => upd("telefono", e.target.value)} placeholder="3001234567" className={IC} /></div>
              <div className="col-span-2"><Label text="Correo Electrónico" /><input type="email" value={form.correo} onChange={(e) => upd("correo", e.target.value)} placeholder="correo@dominio.com" className={IC} /></div>
              <div>
                <Label text="Estado" />
                <div className="relative">
                  <select value={form.estado} onChange={(e) => upd("estado", e.target.value as "Activo" | "Inactivo")} className={IC}>
                    <option>Activo</option><option>Inactivo</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label text="Aniversario / Inauguración" />
                <input type="date" value={form.aniversario} onChange={(e) => upd("aniversario", e.target.value)} className={IC} />
                <p className="text-[10px] text-[#6B7A99] mt-1">Fecha de apertura o celebración</p>
              </div>
              <div className="col-span-3"><Label text="Observaciones" /><textarea value={form.observaciones} onChange={(e) => upd("observaciones", e.target.value)} rows={2} placeholder="Notas sobre el cliente..." className={`${IC} resize-none`} /></div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button onClick={handleSave} className="text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{ background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43,181,195,0.35)" }}>Guardar</button>
              <button onClick={closeForm} className="text-[13px] font-bold text-[#6B7A99] px-4 py-2.5 rounded-xl border border-[rgba(27,43,75,0.1)] hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      
      <div className="bg-white rounded-2xl border border-[rgba(27,43,75,0.06)] overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(27,43,75,0.06)" }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(27,43,75,0.06)]">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, NIT, representante..." className={`${IC} pl-8`} />
          </div>
          <div className="flex gap-1 ml-auto">
            {(["Todos", "Activo", "Inactivo"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${filter === f ? "text-white" : "text-[#6B7A99] hover:bg-gray-100"}`} style={filter === f ? { background: "#2BB5C3" } : {}}>{f}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(27,43,75,0.06)]" style={{ background: "#F8FAFC" }}>
                {["Cliente / Razón Social", "NIT", "Representante Legal", "Teléfono", "Correo", "Aniversario", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-[#6B7A99] text-[13px]">No se encontraron clientes</td></tr>
              )}
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-[rgba(27,43,75,0.04)] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#1B2B4B]">{c.nombre}</p>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-mono text-[#6B7A99]">{c.nit || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B7A99]">{c.representanteLegal || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B7A99] whitespace-nowrap">{c.telefono || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B7A99]">{c.correo || "—"}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6B7A99] whitespace-nowrap">
                    {c.aniversario ? (
                      <span className="flex items-center gap-1.5">
                        <span>🎂</span>
                        <span className="font-semibold text-[#1B2B4B]">{fmtAniversario(c.aniversario)}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${c.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewItem(c)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#E8F8FA] text-[#6B7A99] hover:text-[#2BB5C3] flex items-center justify-center transition-colors" title="Ver"><Eye size={13} /></button>
                      <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg bg-[#F4F7FA] hover:bg-[#EEF2F7] text-[#6B7A99] hover:text-[#1B2B4B] flex items-center justify-center transition-colors" title="Editar"><Edit2 size={13} /></button>
                      <button onClick={() => onToggle(c.id)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${c.estado === "Activo" ? "bg-amber-50 hover:bg-amber-100 text-amber-500" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-500"}`} title={c.estado === "Activo" ? "Desactivar" : "Activar"}>
                        {c.estado === "Activo" ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[rgba(27,43,75,0.06)]">
        </div>
      </div>

      
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg,#1B2B4B 0%,#243861 100%)" }}>
              <h2 className="text-white font-extrabold text-[14px]">Detalle del Cliente</h2>
              <button onClick={() => setViewItem(null)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"><X size={14} /></button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                ["Nombre / Razón Social", viewItem.nombre],
                ["NIT",                   viewItem.nit              || "—"],
                ["Representante Legal",   viewItem.representanteLegal || "—"],
                ["Dirección",             viewItem.direccion        || "—"],
                ["Teléfono",              viewItem.telefono         || "—"],
                ["Correo",                viewItem.correo           || "—"],
                ["Aniversario",           viewItem.aniversario ? new Date(viewItem.aniversario + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long" }) : "—"],
                ["Estado",                viewItem.estado],
                ["Observaciones",         viewItem.observaciones    || "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <span className="text-[12px] font-bold text-[#6B7A99] w-36 shrink-0">{k}</span>
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