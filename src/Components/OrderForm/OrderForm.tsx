import { useState } from "react";
import type { FormOrden, PaymentRow, PetEntry } from "../../types";
import { AlertCircle, ChevronDown, ChevronUp, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { CLIENTES, DOMICILIARIOS, IC, MEDIOS_PAGO, newPaymentRow, newPet, RESPONSABLES, SERVICIOS_POR_TIPO } from "../../constants";

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">
      {text}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;
}

const TABS = [
    { id: "general",      emoji: "📋", label: "General" },
    { id: "mascotas",     emoji: "🐾", label: "Mascotas" },
    { id: "domicilio",    emoji: "🚗", label: "Domicilio" },
    { id: "pago",         emoji: "💳", label: "Pago" },
    { id: "observaciones",emoji: "📝", label: "Observaciones" },
];

function PetCard({pet, index, onChange, onRemove, canRemove}: {
    pet: PetEntry;
    index: number;
    onChange: (id: string, key: keyof PetEntry, val: string) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
}) {
    const [open, setOpen] = useState(true);
    const upd = (k: keyof PetEntry, v: string) => onChange(pet.id, k, v);

    return(
        <div className="border border-[rgba(27, 43, 75, 0.1)] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" style={{background: open ? "F8FAFC" : "white"}} onClick={() => setOpen((o) => !o)}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{background: "#2BB5C3"}}>
                    {index + 1}
                </div>
                <span className="flex-1 text-[13px] font-semibold text-[#1B2B4B]">
                    {pet.nombre || `Mascota ${index + 1}`}
                </span>
                {
                
                  pet.estadoMuestra === "Coagulada" && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        Coagulada
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                      {
                        canRemove && (
                          <button type="button" onClick={(e) => {e.stopPropagation(); onRemove(pet.id)}} className="p-1 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
                              <Trash2 size={13}/>
                          </button>
                        )}
                        {open ? <ChevronUp size={15} className="text-gray-400"/> : <ChevronDown size={15} className="text-gray-400"/>}
                  </div>
            </div>

            {
              open && (
                <div className="p-4 grid grid-cols-4 gap-3 border-t border-[rgba(27, 43, 75, 0.06)]">
                    <div className="col-span-2">
                        <Label text="Nombre de la Mascota" required/>
                        <input value={pet.nombre} onChange={(e) => upd("nombre", e.target.value)} placeholder="Ej: Rocko" className={IC} />
                    </div>
                    <div className="col-span-2">
                      <Label text="Propietario"/>
                      <input value={pet.propietario} onChange={(e) => upd("propietario", e.target.value)} placeholder="Nombre del dueño" className={IC} />
                    </div>
                    <div>
                      <Label text="Teléfono"/>
                      <input value={pet.telefono} onChange={(e) => upd("telefono", e.target.value)} placeholder="3001234567" className={IC} />
                    </div>
                    <div className="col-span-2">
                      <Label text="Correo Electrónico"/>
                      <input value={pet.correo} onChange={(e) => upd("correo", e.target.value)} placeholder="correo@email.com" className={IC} />
                    </div>
                    <div>
                      <Label text="Especie"/>
                      <select value={pet.especie} onChange={(e) => upd("especie", e.target.value)} className={IC}>
                          <option value="">Seleccionar....</option>
                          <option>Canino</option>
                          <option>Felino</option>
                          <option>Ave</option>
                          <option>Reptil</option>
                          <option>Otro</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label text="Raza"/>
                      <input value={pet.raza} onChange={(e) => upd("raza", e.target.value)} placeholder="Ej: Golden Retriever" className={IC}/>
                    </div>
                    <div>
                      <Label text="Sexo"/>
                      <select value={pet.sexo} onChange={(e) => upd("sexo", e.target.value)} className={IC}>
                          <option value="">Seleccionar....</option>
                          <option>Macho</option>
                          <option>Hembra</option>
                      </select>
                    </div>
                    <div>
                      <Label text="Edad"/>
                      <input value={pet.edad} onChange={(e) => upd("edad", e.target.value)} placeholder="Ej: 3 años" className={IC} />
                    </div>
                    <div>
                      <Label text="Hora de Envio"/>
                      <input type="time" value={pet.horaEnvio} onChange={(e) => upd("horaEnvio", e.target.value)} className={IC}/>
                    </div>
                    <div className="col-span-2">
                      <Label text="Estado de la Muestra"/>
                      <div className="flex gap-2 h-[38px]">
                          {(["Normal", "Coagulada"] as const).map((m) => (
                            <button key={m} type="button" onClick={() => upd("estadoMuestra", m)} className={`flex-1 rounded-xl text-[12px] font-bold border transition-all ${pet.estadoMuestra === m ? m === "Normal" ? "bg-emerald-500 text-white border-emerald-500" : "bg-amber-500 text-white border-amber-500" : "bg-[#F4F7FA] text-[#6B7A99] border-[rgba(27,43,75,0.1)] hover:bg-gray-100"}`}>
                              {m}
                            </button>
                          ))}
                      </div>
                      {
                        pet.estadoMuestra === "Coagulada" && (
                          <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                            ⚠️ No contabiliza como examen nuevo, sí como domicilio.
                          </p>
                        )}
                    </div>
                </div>
              )}
        </div>
    );
}

function PaymentBlock({
  pagos, valorTotal, estadoPago, movimiento,
  onAddRow, onUpdateRow, onRemoveRow,
  onValorTotal, onEstadoPago, onMovimiento,
}: {
  pagos: PaymentRow[];
  valorTotal: string;
  estadoPago: "Pagado" | "Pendiente por pago";
  movimiento: "Ingreso" | "Gasto";
  onAddRow: () => void;
  onUpdateRow: (id: string, key: keyof PaymentRow, val: string) => void;
  onRemoveRow: (id: string) => void;
  onValorTotal: (v: string) => void;
  onEstadoPago: (v: "Pagado" | "Pendiente por pago") => void;
  onMovimiento: (v: "Ingreso" | "Gasto") => void;
}) {
  const totalPagado = pagos.reduce((a, p) => a + Number(p.valor || 0), 0);
  const total = Number(valorTotal || 0);
  const pendiente = Math.max(0, total - totalPagado);

  return (
    <div className="space-y-5">
      {/* Valor total de la orden */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label text="Valor Total de la Orden ($COP)" required />
          <input
            type="number"
            value={valorTotal}
            onChange={(e) => onValorTotal(e.target.value)}
            placeholder="0"
            className={IC}
          />
        </div>
        <div>
          <Label text="Movimiento" />
          <div className="flex gap-2 h-[38px]">
            {(["Ingreso", "Gasto"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMovimiento(m)}
                className={`flex-1 rounded-xl text-[12px] font-bold border transition-all ${
                  movimiento === m
                    ? m === "Ingreso"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-rose-500 text-white border-rose-500"
                    : "bg-[#F4F7FA] text-[#6B7A99] border-[rgba(27,43,75,0.1)] hover:bg-gray-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label text="Estado del Pago" />
          <div className="flex gap-2 h-[38px]">
            {(["Pagado", "Pendiente por pago"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onEstadoPago(s)}
                className={`flex-1 rounded-xl text-[11px] font-bold border transition-all px-2 ${
                  estadoPago === s
                    ? s === "Pagado"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-amber-500 text-white border-amber-500"
                    : "bg-[#F4F7FA] text-[#6B7A99] border-[rgba(27,43,75,0.1)] hover:bg-gray-100"
                }`}
              >
                {s === "Pagado" ? "Pagado" : "Pendiente"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment rows */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label text="Métodos de Pago" />
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#2BB5C3] hover:text-[#1a9aaa] transition-colors"
          >
            <Plus size={14} /> Agregar método
          </button>
        </div>

        <div className="space-y-2">
          {pagos.map((row, i) => (
            <div key={row.id} className="flex gap-3 items-center">
              <div className="w-6 h-6 rounded-full bg-[#F4F7FA] flex items-center justify-center text-[10px] font-bold text-[#6B7A99] shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <select
                  value={row.medio}
                  onChange={(e) => onUpdateRow(row.id, "medio", e.target.value)}
                  className={IC}
                >
                  <option value="">Medio de pago...</option>
                  {MEDIOS_PAGO.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="w-36">
                <input
                  type="number"
                  value={row.valor}
                  onChange={(e) => onUpdateRow(row.id, "valor", e.target.value)}
                  placeholder="$0"
                  className={IC}
                />
              </div>
              {pagos.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveRow(row.id)}
                  className="p-1.5 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#F4F7FA] rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider mb-1">Total Pagado</p>
          <p className="text-[18px] font-extrabold text-emerald-600">
            ${totalPagado.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="bg-[#F4F7FA] rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider mb-1">Valor Pendiente</p>
          <p className={`text-[18px] font-extrabold ${pendiente > 0 ? "text-amber-500" : "text-emerald-600"}`}>
            ${pendiente.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="bg-[#F4F7FA] rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider mb-1">Estado</p>
          <span className={`inline-block text-[12px] font-bold px-3 py-1 rounded-lg ${
            estadoPago === "Pagado"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {estadoPago}
          </span>
        </div>
      </div>
    </div>
  );
}

interface OrderFormProps {
  factura: string;
  editingId: string | null;
  errors: Record<string, string>;
  onSave: (form: FormOrden) => void;
  onClear: () => void;
  onCancelEdit: () => void;
}

export default function OrderForm({
  factura, editingId, errors, onSave, onClear, onCancelEdit,
}: OrderFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<FormOrden>({
    fecha: new Date().toISOString().split("T")[0],
    numeroOrden: "", responsable: "GISSEL", cliente: "",
    tipoServicio: "", descripcionServicio: "", cantidad: "1",
    nombreMedico: "", matriculaMedico: "",
    mascotas: [newPet()],
    domiciliario: "", horaLlamada: "", horaLlegada: "",
    prioridad: "Normal",
    valorTotal: "", pagos: [newPaymentRow()],
    estadoPago: "Pendiente por pago", movimiento: "Ingreso",
    observaciones: "",
  });

  const upd = (k: keyof FormOrden, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Pet handlers
  const handlePetChange = (id: string, key: keyof PetEntry, val: string) =>
    upd("mascotas", form.mascotas.map((p) => p.id === id ? { ...p, [key]: val } : p));

  const addPet = () => upd("mascotas", [...form.mascotas, newPet()]);
  const removePet = (id: string) =>
    upd("mascotas", form.mascotas.filter((p) => p.id !== id));

  // Payment handlers
  const addPayRow = () => upd("pagos", [...form.pagos, newPaymentRow()]);
  const updatePayRow = (id: string, key: keyof PaymentRow, val: string) =>
    upd("pagos", form.pagos.map((r) => r.id === id ? { ...r, [key]: val } : r));
  const removePayRow = (id: string) =>
    upd("pagos", form.pagos.filter((r) => r.id !== id));

  const handleClear = () => {
    setForm({
      fecha: new Date().toISOString().split("T")[0],
      numeroOrden: "", responsable: "GISSEL", cliente: "",
      tipoServicio: "", descripcionServicio: "", cantidad: "1",
      nombreMedico: "", matriculaMedico: "",
      mascotas: [newPet()],
      domiciliario: "", horaLlamada: "", horaLlegada: "",
      prioridad: "Normal",
      valorTotal: "", pagos: [newPaymentRow()],
      estadoPago: "Pendiente por pago", movimiento: "Ingreso",
      observaciones: "",
    });
    setActiveTab("general");
    onClear();
  };

  const serviciosDisponibles = form.tipoServicio
    ? SERVICIOS_POR_TIPO[form.tipoServicio] ?? []
    : [];

  const tabHasError = (tabId: string) => {
    if (tabId === "general")   return !!(errors.cliente || errors.tipoServicio || errors.descripcionServicio);
    if (tabId === "mascotas")  return !!(errors.mascotas);
    if (tabId === "pago")      return !!(errors.valorTotal || errors.pagos);
    return false;
  };

  const Actions = () => (
    <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(27,43,75,0.06)]">
      <button
        onClick={() => onSave(form)}
        className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
        style={{ background: "#2BB5C3", boxShadow: "0 4px 12px rgba(43,181,195,0.35)" }}
      >
        <Save size={15} />
        {editingId ? "Guardar Cambios" : "Guardar Orden"}
      </button>
      <button
        onClick={handleClear}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors"
      >
        <RefreshCw size={14} /> Limpiar
      </button>
      {editingId && (
        <button
          onClick={() => { handleClear(); onCancelEdit(); }}
          className="flex items-center gap-2 border border-[rgba(27,43,75,0.1)] hover:bg-gray-50 text-[#6B7A99] text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <X size={14} /> Cancelar edición
        </button>
      )}
    </div>
  );

  return (
    <div
      className="bg-white rounded-2xl border border-[rgba(27,43,75,0.06)] overflow-hidden"
      style={{ boxShadow: "0 1px 6px rgba(27,43,75,0.06)" }}
    >
      {/* Form header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#1B2B4B 0%,#243861 100%)" }}
      >
        <div>
          <h2 className="text-white font-extrabold text-[15px] tracking-tight">
            {editingId ? "Editar Orden" : "Nueva Orden de Servicio"}
          </h2>
          <p className="text-white/45 text-[11px] mt-0.5">
            Una orden puede incluir varias mascotas, múltiples servicios y pagos combinados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingId && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-lg font-mono" style={{ background: "rgba(232,68,154,0.2)", color: "#E8449A" }}>
              EDITANDO
            </span>
          )}
          <span className="text-[11px] font-bold text-[#2BB5C3] bg-[#2BB5C3]/15 px-3 py-1.5 rounded-lg font-mono tracking-wider">
            {factura}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(27,43,75,0.08)] px-6 pt-3 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const hasErr = tabHasError(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-[13px] font-bold whitespace-nowrap transition-all border-b-2 ${
                active
                  ? "border-[#2BB5C3] text-[#2BB5C3] bg-[#2BB5C3]/5"
                  : "border-transparent text-[#6B7A99] hover:text-[#1B2B4B]"
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
              {tab.id === "mascotas" && form.mascotas.length > 1 && (
                <span className="text-[10px] font-bold bg-[#2BB5C3]/15 text-[#2BB5C3] px-1.5 py-0.5 rounded-full">
                  {form.mascotas.length}
                </span>
              )}
              {hasErr && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {/* ── Tab: General ──────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label text="Fecha" required />
                <input type="date" value={form.fecha} onChange={(e) => upd("fecha", e.target.value)} className={IC} />
              </div>
              <div>
                <Label text="N° Orden" />
                <input value={form.numeroOrden} onChange={(e) => upd("numeroOrden", e.target.value)} placeholder="106025" className={IC} />
              </div>
              <div>
                <Label text="Responsable del Registro" required />
                <select value={form.responsable} onChange={(e) => upd("responsable", e.target.value)} className={IC}>
                  {RESPONSABLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label text="Cantidad de Servicios" required />
                <input type="number" min="1" value={form.cantidad} onChange={(e) => upd("cantidad", e.target.value)} className={IC} />
              </div>
            </div>

            <div>
              <Label text="Cliente" required />
              <select
                value={form.cliente}
                onChange={(e) => upd("cliente", e.target.value)}
                className={`${IC} ${errors.cliente ? "border-rose-400" : ""}`}
              >
                <option value="">Seleccionar cliente / clínica...</option>
                {CLIENTES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <FieldErr msg={errors.cliente} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label text="Tipo de Servicio" required />
                <select
                  value={form.tipoServicio}
                  onChange={(e) => { upd("tipoServicio", e.target.value); upd("descripcionServicio", ""); }}
                  className={`${IC} ${errors.tipoServicio ? "border-rose-400" : ""}`}
                >
                  <option value="">Seleccionar tipo...</option>
                  {Object.keys(SERVICIOS_POR_TIPO).map((t) => <option key={t}>{t}</option>)}
                </select>
                <FieldErr msg={errors.tipoServicio} />
              </div>
              <div>
                <Label text="Descripción del Servicio" required />
                <select
                  value={form.descripcionServicio}
                  onChange={(e) => upd("descripcionServicio", e.target.value)}
                  disabled={!form.tipoServicio}
                  className={`${IC} ${errors.descripcionServicio ? "border-rose-400" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {form.tipoServicio ? "Seleccionar descripción..." : "Seleccione primero el tipo"}
                  </option>
                  {serviciosDisponibles.map((s) => <option key={s}>{s}</option>)}
                </select>
                <FieldErr msg={errors.descripcionServicio} />
              </div>
            </div>

            {/* Médico Veterinario */}
            <div className="pt-2 border-t border-[rgba(27,43,75,0.06)]">
              <p className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🩺</span> Médico Veterinario
                <span className="flex-1 h-px bg-[rgba(27,43,75,0.08)]" />
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label text="Nombre del Médico Veterinario" />
                  <input value={form.nombreMedico} onChange={(e) => upd("nombreMedico", e.target.value)} placeholder="Dr. Nombre Apellido" className={IC} />
                </div>
                <div>
                  <Label text="Matrícula Profesional" />
                  <input value={form.matriculaMedico} onChange={(e) => upd("matriculaMedico", e.target.value)} placeholder="MP-12345" className={IC} />
                </div>
              </div>
            </div>
            <Actions />
          </div>
        )}

        {/* ── Tab: Mascotas ──────────────────────────────────────────── */}
        {activeTab === "mascotas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] text-[#6B7A99]">
                <span className="font-bold text-[#1B2B4B]">{form.mascotas.length}</span> mascota{form.mascotas.length !== 1 ? "s" : ""} en esta orden
              </p>
              <button
                type="button"
                onClick={addPet}
                className="flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-colors"
                style={{ background: "#2BB5C3", boxShadow: "0 4px 10px rgba(43,181,195,0.3)" }}
              >
                <Plus size={15} /> Agregar Mascota
              </button>
            </div>

            <div className="space-y-3">
              {form.mascotas.map((pet, i) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  index={i}
                  onChange={handlePetChange}
                  onRemove={removePet}
                  canRemove={form.mascotas.length > 1}
                />
              ))}
            </div>
            <Actions />
          </div>
        )}

        {/* ── Tab: Domicilio ──────────────────────────────────────────── */}
        {activeTab === "domicilio" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label text="Domiciliario" />
                <select value={form.domiciliario} onChange={(e) => upd("domiciliario", e.target.value)} className={IC}>
                  <option value="">Sin domicilio</option>
                  {DOMICILIARIOS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label text="Hora de Llamada" />
                <input type="time" value={form.horaLlamada} onChange={(e) => upd("horaLlamada", e.target.value)} className={IC} />
              </div>
              <div>
                <Label text="Hora de Llegada" />
                <input type="time" value={form.horaLlegada} onChange={(e) => upd("horaLlegada", e.target.value)} className={IC} />
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(27,43,75,0.06)]">
              <p className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🚦</span> Prioridad
                <span className="flex-1 h-px bg-[rgba(27,43,75,0.08)]" />
              </p>
              <div className="flex gap-3">
                {(["Normal", "Prioritaria"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => upd("prioridad", p)}
                    className={`flex-1 py-3 rounded-xl text-[13px] font-bold border-2 transition-all ${
                      form.prioridad === p
                        ? p === "Normal"
                          ? "border-[#2BB5C3] bg-[#2BB5C3]/10 text-[#2BB5C3]"
                          : "border-[#E8449A] bg-[#E8449A]/10 text-[#E8449A]"
                        : "border-[rgba(27,43,75,0.1)] text-[#6B7A99] hover:bg-gray-50"
                    }`}
                  >
                    {p === "Normal" ? "🟢 Normal" : "🔴 Prioritaria"}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[rgba(27,43,75,0.06)]">
              <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider mb-2">Hora de envío por mascota</p>
              {form.mascotas.map((pet, i) => (
                <div key={pet.id} className="flex items-center gap-3 py-1.5 border-b border-[rgba(27,43,75,0.06)] last:border-0">
                  <span className="text-[12px] font-semibold text-[#1B2B4B] flex-1">
                    {pet.nombre || `Mascota ${i + 1}`}
                  </span>
                  <span className="text-[12px] text-[#6B7A99]">
                    {pet.horaEnvio || <span className="italic">Sin hora asignada</span>}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-[#6B7A99] mt-2">
                Las horas de envío se configuran en la pestaña Mascotas.
              </p>
            </div>
            <Actions />
          </div>
        )}

        {/* ── Tab: Pago ──────────────────────────────────────────── */}
        {activeTab === "pago" && (
          <div className="space-y-4">
            <PaymentBlock
              pagos={form.pagos}
              valorTotal={form.valorTotal}
              estadoPago={form.estadoPago}
              movimiento={form.movimiento}
              onAddRow={addPayRow}
              onUpdateRow={updatePayRow}
              onRemoveRow={removePayRow}
              onValorTotal={(v) => upd("valorTotal", v)}
              onEstadoPago={(v) => upd("estadoPago", v)}
              onMovimiento={(v) => upd("movimiento", v)}
            />
            <Actions />
          </div>
        )}

        {/* ── Tab: Observaciones ──────────────────────────────────────── */}
        {activeTab === "observaciones" && (
          <div className="space-y-4">
            <div>
              <Label text="Observaciones / Notas Clínicas" />
              <textarea
                value={form.observaciones}
                onChange={(e) => upd("observaciones", e.target.value)}
                placeholder="Notas adicionales, indicaciones especiales, condiciones de la muestra..."
                rows={5}
                className={`${IC} resize-none`}
              />
            </div>

            {/* Summary */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[rgba(27,43,75,0.06)] space-y-2">
              <p className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest mb-3">Resumen de la Orden</p>
              {[
                ["Cliente", form.cliente || "—"],
                ["Tipo de Servicio", form.tipoServicio || "—"],
                ["Descripción", form.descripcionServicio || "—"],
                ["Cantidad", form.cantidad],
                ["Mascotas", `${form.mascotas.length} mascota${form.mascotas.length !== 1 ? "s" : ""}: ${form.mascotas.map((p) => p.nombre || "Sin nombre").join(", ")}`],
                ["Domiciliario", form.domiciliario || "Sin domicilio"],
                ["Prioridad", form.prioridad],
                ["Valor Total", form.valorTotal ? `$${Number(form.valorTotal).toLocaleString("es-CO")}` : "—"],
                ["Estado de Pago", form.estadoPago],
                ["Movimiento", form.movimiento],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-[12px]">
                  <span className="text-[#6B7A99] font-medium">{k}</span>
                  <span className="text-[#1B2B4B] font-semibold text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <Actions />
          </div>
        )}
      </div>
    </div>
  );
}
