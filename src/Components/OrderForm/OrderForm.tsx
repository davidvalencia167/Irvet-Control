import { useEffect, useMemo, useState } from "react";
import type { FormOrden, PaymentRow, PetEntry } from "../../types";
import { AlertCircle, ChevronDown, ChevronUp, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { CLIENTES, DOMICILIARIOS, EMPTY_FORM, IC, MEDIOS_PAGO, newPaymentRow, newPet, RESPONSABLES } from "../../constants";
import { BREEDS_BY_SPECIES, SPECIES } from "../../constants/breeds";
import { calculatePetServicesTotal, type ServicioCatalogo } from "../../constants/services";

function Label({ text, required }: { text: string; required?: boolean }) {
  return <label className="block text-[11px] font-bold text-[#6B7A99] mb-1.5 uppercase tracking-wider">{text}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>;
}
function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;
}

const TABS = [
  { id: "general", emoji: "📋", label: "General" },
  { id: "mascotas", emoji: "🐾", label: "Mascotas" },
  { id: "pago", emoji: "💳", label: "Pago" },
  { id: "observaciones", emoji: "📝", label: "Observaciones" },
];

function PetCard({ pet, index, catalogo, medico, onChange, onMedicoChange, onRemove, canRemove }: {
  pet: PetEntry; index: number; catalogo: Record<string, ServicioCatalogo[]>;
  medico: { nombre: string; matricula: string };
  onChange: (id: string, patch: Partial<PetEntry>) => void;
  onMedicoChange: (patch: { nombreMedico?: string; matriculaMedico?: string }) => void;
  onRemove: (id: string) => void; canRemove: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const breeds = BREEDS_BY_SPECIES[pet.especie] ?? [];
  const tipos = Object.keys(catalogo).filter((type) => type !== "Paquete" && type !== "Paquetes");
  const [tipo, setTipo] = useState("");
  const available = useMemo(() => (tipo ? catalogo[tipo] ?? [] : []).filter(s => `${s.nombre} ${s.categoria}`.toLowerCase().includes(search.toLowerCase())), [catalogo, tipo, search]);

  const update = (patch: Partial<PetEntry>) => onChange(pet.id, patch);
  const toggleService = (service: ServicioCatalogo) => {
    const exists = pet.servicios.some(s => s.descripcion === service.nombre);
    const servicios = exists
      ? pet.servicios.filter(s => s.descripcion !== service.nombre)
      : [...pet.servicios, { id: crypto.randomUUID(), tipo, descripcion: service.nombre, categoria: service.categoria, precio: service.precio, cantidad: 1 }];
    update({ servicios });
  };

  return <div className="border border-[rgba(27,43,75,0.1)] rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" style={{ background: open ? "#F8FAFC" : "white" }} onClick={() => setOpen(o => !o)}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: "#2BB5C3" }}>{index + 1}</div>
      <span className="flex-1 text-[13px] font-semibold text-[#1B2B4B]"><span className="block">{pet.nombre || `Mascota ${index + 1}`}</span><span className="block text-[10px] font-mono font-normal text-[#6B7A99]">Orden {pet.numeroOrden || "Sin asignar"} · {pet.servicios.length} servicio{pet.servicios.length !== 1 ? "s" : ""}</span></span>
      {pet.estadoMuestra === "Coagulada" && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coagulada</span>}
      {canRemove && <button type="button" onClick={e => { e.stopPropagation(); onRemove(pet.id); }} className="p-1 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"><Trash2 size={13}/></button>}
      {open ? <ChevronUp size={15} className="text-gray-400"/> : <ChevronDown size={15} className="text-gray-400"/>}
    </div>
    {open && <div className="p-4 space-y-5 border-t border-[rgba(27,43,75,0.06)]">
      <section className="space-y-3">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos de la mascota</p><p className="text-[10px] text-[#6B7A99]">Identificación y características del paciente.</p></div>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2"><Label text="N° Orden asignado por laboratorio"/><input value={pet.numeroOrden} onChange={e => update({ numeroOrden: e.target.value })} placeholder="Ej: 106025" className={IC}/></div>
          <div className="col-span-2"><Label text="Nombre de la Mascota" required/><input value={pet.nombre} onChange={e => update({ nombre: e.target.value })} placeholder="Ej: Rocko" className={IC}/></div>
          <div><Label text="Especie"/><select value={pet.especie} onChange={e => update({ especie: e.target.value, raza: "" })} className={IC}><option value="">Seleccionar especie...</option>{SPECIES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="col-span-2"><Label text="Raza"/><select value={pet.raza} onChange={e => update({ raza: e.target.value })} disabled={!pet.especie} className={`${IC} disabled:opacity-50`}><option value="">{pet.especie ? "Seleccionar raza..." : "Seleccione primero la especie"}</option>{breeds.map(b => <option key={b}>{b}</option>)}</select></div>
          <div><Label text="Sexo"/><select value={pet.sexo} onChange={e => update({ sexo: e.target.value })} className={IC}><option value="">Seleccionar...</option><option>Macho</option><option>Hembra</option></select></div>
          <div><Label text="Edad"/><div className="grid grid-cols-2 gap-2"><input type="number" min="0" value={pet.edadAnios} onChange={e => update({ edadAnios: e.target.value, edad: `${e.target.value || "0"} años, ${pet.edadMeses || "0"} meses` })} placeholder="Años" className={IC}/><input type="number" min="0" max="11" value={pet.edadMeses} onChange={e => update({ edadMeses: e.target.value, edad: `${pet.edadAnios || "0"} años, ${e.target.value || "0"} meses` })} placeholder="Meses" className={IC}/></div></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label text="Estado de la muestra"/><select value={pet.estadoMuestra} onChange={e => update({ estadoMuestra: e.target.value as PetEntry["estadoMuestra"] })} className={IC}><option>Normal</option><option>Coagulada</option></select></div>
          <div><Label text="Hora de envío"/><input type="time" value={pet.horaEnvio} onChange={e => update({ horaEnvio: e.target.value })} className={IC}/></div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[rgba(27,43,75,0.08)] pt-5">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos del médico veterinario</p><p className="text-[10px] text-[#6B7A99]">Profesional remitente asociado a esta orden.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label text="Nombre del médico veterinario"/><input value={medico.nombre} onChange={e => onMedicoChange({ nombreMedico: e.target.value })} placeholder="Nombre del médico" className={IC}/></div>
          <div><Label text="M.P."/><input value={medico.matricula} onChange={e => onMedicoChange({ matriculaMedico: e.target.value })} placeholder="MP-12345" className={IC}/></div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[rgba(27,43,75,0.08)] pt-5">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos del propietario</p><p className="text-[10px] text-[#6B7A99]">Información de contacto del responsable de la mascota.</p></div>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2"><Label text="Propietario"/><input value={pet.propietario} onChange={e => update({ propietario: e.target.value })} placeholder="Nombre del dueño" className={IC}/></div>
          <div><Label text="N° Celular"/><input value={pet.telefono} onChange={e => update({ telefono: e.target.value })} placeholder="3001234567" className={IC}/></div>
          <div><Label text="Correo Electrónico"/><input value={pet.correo} onChange={e => update({ correo: e.target.value })} placeholder="correo@email.com" className={IC}/></div>
        </div>
      </section>

      <div className="rounded-xl border border-[rgba(27,43,75,0.08)] p-4">
        <div className="flex items-center justify-between mb-3"><div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Servicios / Exámenes</p><p className="text-[10px] text-[#6B7A99]">Los servicios se registran para esta mascota.</p></div><span className="text-[11px] font-bold bg-[#2BB5C3]/10 text-[#2BB5C3] px-2 py-1 rounded-lg">{pet.servicios.length} seleccionados</span></div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div><Label text="Tipo de servicio"/><select value={tipo} onChange={e => {setTipo(e.target.value); setSearch("")}} className={IC}><option value="">Seleccionar tipo...</option>{tipos.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="col-span-2"><Label text="Buscar descripción"/><input value={search} onChange={e => setSearch(e.target.value)} disabled={!tipo} placeholder="Buscar examen..." className={`${IC} disabled:opacity-50`}/></div>
        </div>
        {tipo && <div className="max-h-36 overflow-y-auto space-y-2 rounded-xl bg-[#F8FAFC] p-3">{available.map(service => <label key={`${service.categoria}-${service.nombre}`} className="flex items-start gap-2 text-[12px] cursor-pointer"><input type="checkbox" checked={pet.servicios.some(s => s.descripcion === service.nombre)} onChange={() => toggleService(service)} className="mt-0.5 accent-[#2BB5C3]"/><span><span className="font-semibold">{service.nombre}</span> <span className="text-[#6B7A99]">({service.categoria}) · ${service.precio.toLocaleString("es-CO")}</span></span></label>)}</div>}
        {pet.servicios.length > 0 && <div className="mt-3 space-y-1.5">{pet.servicios.map(s => <div key={s.id} className="flex items-center justify-between text-[11px] bg-white border border-[rgba(27,43,75,0.06)] rounded-lg px-3 py-2"><span><b>{s.tipo}</b> · {s.descripcion}</span><span className="font-bold">${s.precio.toLocaleString("es-CO")}</span></div>)}<div className="flex items-center justify-between border-t border-[rgba(27,43,75,0.1)] pt-2 text-[12px] font-extrabold text-[#1B2B4B]"><span>Total de esta mascota</span><span>${calculatePetServicesTotal(pet.servicios).toLocaleString("es-CO")}</span></div></div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label text="Estado de la muestra"/><select value={pet.estadoMuestra} onChange={e => update({ estadoMuestra: e.target.value as PetEntry["estadoMuestra"] })} className={IC}><option>Normal</option><option>Coagulada</option></select></div>
        <div><Label text="Hora de envío"/><input type="time" value={pet.horaEnvio} onChange={e => update({ horaEnvio: e.target.value })} className={IC}/></div>
      </div>
    </div>}
  </div>;
}

function PaymentBlock({
  pagos,
  mascotas,
  valorTotal,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}: {
  pagos: PaymentRow[];
  mascotas: PetEntry[];
  valorTotal: string;
  onAddRow: () => void;
  onUpdateRow: (
    id: string,
    key: keyof PaymentRow,
    val: string
  ) => void;
  onRemoveRow: (id: string) => void;
}) {
  const total = Number(valorTotal || 0);

  const totalPagado = pagos
    .filter((p) => (p.tipo ?? "Pago") === "Pago")
    .reduce((sum, p) => sum + Number(p.valor || 0), 0);

  const totalCubierto = pagos.reduce(
    (sum, p) => sum + Number(p.valor || 0),
    0
  );

  const pendiente = Math.max(0, total - totalCubierto);

  const estado =
    total > 0 && totalCubierto >= total
      ? "Pagado"
      : totalCubierto > 0
        ? "Pago parcial"
        : "Pendiente por pago";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Valor total
          </p>
          <p className="text-[18px] font-extrabold text-[#1B2B4B]">
            ${total.toLocaleString("es-CO")}
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Dinero recibido
          </p>
          <p className="text-[18px] font-extrabold text-emerald-600">
            ${totalPagado.toLocaleString("es-CO")}
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-[10px] font-bold text-blue-700 uppercase">
            Promoción / obsequio
          </p>
          <p className="text-[18px] font-extrabold text-blue-700">
            ${(totalCubierto - totalPagado).toLocaleString("es-CO")}
          </p>
        </div>

        <div
          className={`${
            pendiente > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          } rounded-xl p-3 border`}
        >
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Saldo
          </p>
          <p
            className={`text-[18px] font-extrabold ${
              pendiente > 0 ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            ${pendiente.toLocaleString("es-CO")}
          </p>
          <span className="text-[10px] font-bold">{estado}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label text="Métodos de pago y beneficios" />

          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#2BB5C3]"
          >
            <Plus size={14} />
            Agregar movimiento
          </button>
        </div>

        <div className="space-y-3">
          {pagos.map((row, index) => {
            const mascota = mascotas.find(
              (pet) => pet.id === row.mascotaId
            );

            const examenes =
              mascota?.servicios.map((service) => service.descripcion).join(", ") ||
              "Sin exámenes";

            const tipo = row.tipo ?? "Pago";

            return (
              <div
                key={row.id}
                className="rounded-xl border border-[rgba(27,43,75,0.08)] p-3 space-y-2"
              >
                <div className="grid grid-cols-[24px_minmax(150px,0.8fr)_minmax(220px,1.5fr)_128px_34px] items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F4F7FA] flex items-center justify-center text-[10px] font-bold text-[#6B7A99]">
                    {index + 1}
                  </div>

                  <select
                    value={tipo}
                    onChange={(e) =>
                      onUpdateRow(row.id, "tipo", e.target.value)
                    }
                    className={`${IC} w-full! h-10`}
                  >
                    <option value="Pago">Pago recibido</option>
                    <option value="Promoción">Promoción</option>
                    <option value="Obsequio">Obsequio / Gratis</option>
                  </select>

                  {tipo === "Pago" && (
                    <select
                      value={row.medio}
                      onChange={(e) =>
                        onUpdateRow(row.id, "medio", e.target.value)
                      }
                      className={`${IC} w-full! h-10 min-w-0`}
                    >
                      <option value="">Método de pago...</option>
                      {MEDIOS_PAGO.map((medio) => (
                        <option key={medio} value={medio}>
                          {medio}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="number"
                    min="0"
                    value={row.valor}
                    onChange={(e) =>
                      onUpdateRow(row.id, "valor", e.target.value)
                    }
                    placeholder="$0"
                    className={`${IC} w-full! h-10`}
                  />

                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-400 flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-[minmax(220px,0.8fr)_minmax(220px,1.2fr)] items-center gap-3">
                  <select
                    value={row.mascotaId}
                    onChange={(e) =>
                      onUpdateRow(row.id, "mascotaId", e.target.value)
                    }
                    className={`${IC} w-full! h-10`}
                  >
                    <option value="">Asociar a mascota...</option>
                    {mascotas.map((pet) => (
                      <option key={pet.id} value={pet.id}>
                        {pet.nombre || "Sin nombre"} · Orden{" "}
                        {pet.numeroOrden || "Sin número"}
                      </option>
                    ))}
                  </select>

                  <input
                    value={row.concepto}
                    onChange={(e) =>
                      onUpdateRow(row.id, "concepto", e.target.value)
                    }
                    placeholder={
                      tipo === "Obsequio"
                        ? "Ej: Susi gratis"
                        : "Concepto del movimiento"
                    }
                    className={`${IC} w-full! h-10 min-w-0`}
                  />
                </div>

                {mascota && (
                  <p className="text-[11px] text-[#6B7A99]">
                    <strong>{mascota.nombre}</strong> · Orden{" "}
                    {mascota.numeroOrden || "Sin número"} · Exámenes:{" "}
                    {examenes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface OrderFormProps { factura: string; editingId: string | null; initialForm?: FormOrden; errors: Record<string,string>; catalogo: Record<string,ServicioCatalogo[]>; onSave: (form: FormOrden, finalize?: boolean) => void; onClear: () => void; onCancelEdit: () => void; }

export default function OrderForm({ factura, editingId, initialForm, errors, catalogo, onSave, onClear, onCancelEdit }: OrderFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<FormOrden>(() => initialForm ? { ...initialForm, mascotas: initialForm.mascotas.map(p => ({...p, servicios: p.servicios ?? []})), pagos: initialForm.pagos ?? [] } : EMPTY_FORM());
  const completing = Boolean(editingId);
  const upd = (k: keyof FormOrden, v: unknown) => setForm(f => ({...f,[k]:v}));

  useEffect(() => {
    const total = form.mascotas.reduce((sum,p) => sum + calculatePetServicesTotal(p.servicios), 0);
    const totalValue = total ? String(total) : "";
    const totalCubierto = form.pagos.reduce((sum, p) => sum + Number(p.valor || 0), 0);
    const status: FormOrden["estadoPago"] = total > 0 && totalCubierto >= total ? "Pagado" : totalCubierto > 0 ? "Pago parcial" : "Pendiente por pago";
    if (form.valorTotal !== totalValue) upd("valorTotal", totalValue);
    if (form.estadoPago !== status) upd("estadoPago", status);
    const names = form.mascotas.flatMap(p => p.servicios.map(s => s.descripcion));
    const type = form.mascotas[0]?.servicios[0]?.tipo ?? "";
    const desc = names.join(", ");
    if (form.cantidad !== String(names.length)) upd("cantidad", String(names.length));
    if (form.tipoServicio !== type) upd("tipoServicio", type);
    if (form.descripcionServicio !== desc) upd("descripcionServicio", desc);
    if (JSON.stringify(form.serviciosSeleccionados) !== JSON.stringify(names)) upd("serviciosSeleccionados", names);
  }, [form.mascotas, form.pagos, form.valorTotal, form.estadoPago, form.cantidad, form.tipoServicio, form.descripcionServicio, form.serviciosSeleccionados]);

  const updatePet = (id:string, patch:Partial<PetEntry>) => setForm(f => ({...f, mascotas:f.mascotas.map(p => p.id === id ? {...p,...patch}:p)}));
  const addPet = () => setForm(f => ({...f, mascotas:[...f.mascotas,newPet()]}));
  const removePet = (id:string) => setForm(f => ({...f, mascotas:f.mascotas.filter(p => p.id !== id)}));
  const addPay = () => setForm((form) => ({
    ...form,
    pagos: [...form.pagos, newPaymentRow()],
  }));
  const updatePay = (id:string,key:keyof PaymentRow,val:string) => setForm(f => ({...f,pagos:f.pagos.map(p=>p.id===id?{...p,[key]:val}:p)}));
  const removePay = (id:string) => setForm(f => ({...f,pagos:f.pagos.filter(p=>p.id!==id)}));
  const clear = () => { setForm(EMPTY_FORM()); setActiveTab("general"); onClear(); };

  const tabHasError = (id:string) => id === "general" ? Boolean(errors.cliente) : id === "mascotas" ? Boolean(errors.mascotas || errors.servicios) : id === "pago" ? Boolean(errors.pagos) : false;
  const save = (finalize=false) => onSave(form, finalize);

  const Actions = () => <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(27,43,75,0.06)]"><button type="button" onClick={() => save(false)} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl" style={{background:"#2BB5C3",boxShadow:"0 4px 12px rgba(43,181,195,0.35)"}}><Save size={15}/>{completing ? "Guardar avances" : "Guardar solicitud"}</button>{completing && <button type="button" onClick={() => save(true)} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600"><Save size={15}/>Finalizar orden</button>}<button type="button" onClick={clear} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold px-4 py-2.5 rounded-xl"><RefreshCw size={14}/>Limpiar</button>{completing && <button type="button" onClick={() => {clear();onCancelEdit()}} className="flex items-center gap-2 border border-[rgba(27,43,75,0.1)] text-[#6B7A99] text-[13px] font-bold px-4 py-2.5 rounded-xl"><X size={14}/>Cancelar</button>}</div>;

  return <div className="bg-white rounded-2xl border border-[rgba(27,43,75,0.06)] overflow-hidden" style={{boxShadow:"0 1px 6px rgba(27,43,75,0.06)"}}>
    <div className="px-6 py-4 flex items-center justify-between" style={{background:"linear-gradient(135deg,#1B2B4B 0%,#243861 100%)"}}><div><h2 className="text-white font-extrabold text-[15px] tracking-tight">{completing ? "Completar Orden de Servicio" : "Nueva Solicitud de Servicio"}</h2><p className="text-white/60 text-[11px] mt-0.5">{completing ? "La solicitud fue recibida. Complete mascotas, exámenes, pago y observaciones." : "Registre la información general ahora; complete el resto cuando llegue el domiciliario."}</p></div><div className="flex items-center gap-2">{completing && <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-amber-400/20 text-amber-200">{form.estadoOrden}</span>}<span className="text-[11px] font-bold text-[#2BB5C3] bg-[#2BB5C3]/15 px-3 py-1.5 rounded-lg font-mono">{factura}</span></div></div>
    <div className="flex border-b border-[rgba(27,43,75,0.08)] px-6 pt-3 gap-1 overflow-x-auto">{TABS.map(tab => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-[13px] font-bold whitespace-nowrap border-b-2 ${activeTab===tab.id?"border-[#2BB5C3] text-[#2BB5C3] bg-[#2BB5C3]/5":"border-transparent text-[#6B7A99]"}`}><span>{tab.emoji}</span>{tab.label}{tab.id==="mascotas"&&form.mascotas.length>0&&<span className="text-[10px] font-bold bg-[#2BB5C3]/15 text-[#2BB5C3] px-1.5 py-0.5 rounded-full">{form.mascotas.length}</span>}{tabHasError(tab.id)&&<span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>}</button>)}</div>
    <div className="p-6">
      {activeTab === "general" && <div className="space-y-4"><div className="grid grid-cols-4 gap-4"><div><Label text="Fecha" required/><input type="date" value={form.fecha} readOnly className={`${IC} bg-[#F4F7FA]`}/></div><div><Label text="Hora de solicitud" required/><input type="time" value={form.horaSolicitud} readOnly className={`${IC} bg-[#F4F7FA]`}/></div><div><Label text="Responsable" required/><select value={form.responsable} onChange={e=>upd("responsable",e.target.value)} className={IC}>{RESPONSABLES.map(r=><option key={r}>{r}</option>)}</select></div><div><Label text="Prioridad"/><select value={form.prioridad} onChange={e=>upd("prioridad",e.target.value as FormOrden["prioridad"])} className={IC}><option>Normal</option><option>Prioritaria</option><option>Urgente</option></select></div></div><div><Label text="Cliente / Clínica" required/><select value={form.cliente} onChange={e=>upd("cliente",e.target.value)} className={`${IC} ${errors.cliente?"border-rose-400":""}`}><option value="">Seleccionar cliente / clínica...</option>{CLIENTES.map(c=><option key={c}>{c}</option>)}</select><FieldErr msg={errors.cliente}/></div><div><Label text="Domiciliario"/><select value={form.domiciliario} onChange={e=>upd("domiciliario",e.target.value)} className={IC}><option value="">Sin domicilio</option>{DOMICILIARIOS.map(d=><option key={d}>{d}</option>)}</select></div><div className="grid grid-cols-2 gap-4"><div><Label text="Hora de llamada"/><input type="time" value={form.horaLlamada} onChange={e=>upd("horaLlamada",e.target.value)} className={IC}/></div><div><Label text="Hora de llegada"/><input type="time" value={form.horaLlegada} onChange={e=>upd("horaLlegada",e.target.value)} className={IC}/></div></div><div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-800"><b>Pendiente de recepción:</b> esta solicitud puede guardarse sin mascotas, servicios ni pago. Esos datos se completan cuando llegue el domiciliario.</div><Actions/></div>}

      {activeTab === "mascotas" && <div className="space-y-4">{!completing && <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#6B7A99] border border-[rgba(27,43,75,0.06)]">Primero guarda la solicitud general. Cuando llegue el domiciliario, abre la solicitud desde el historial y pulsa <b>Completar</b> para registrar las mascotas y sus exámenes.</div>}{completing && <><div className="flex items-center justify-between"><div><p className="text-[13px] text-[#6B7A99]"><span className="font-bold text-[#1B2B4B]">{form.mascotas.length}</span> mascota{form.mascotas.length!==1?"s":""} en esta orden</p><p className="text-[10px] text-[#6B7A99]">Una orden puede contener varias mascotas y varios servicios por mascota.</p></div><button type="button" onClick={addPet} className="flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2 rounded-xl" style={{background:"#2BB5C3"}}><Plus size={15}/>Agregar mascota</button></div>{form.mascotas.length===0&&<div className="border border-dashed rounded-xl p-8 text-center text-[12px] text-[#6B7A99]">Aún no se han registrado mascotas.</div>}{form.mascotas.map((pet,i)=><PetCard key={pet.id} pet={pet} index={i} catalogo={catalogo} medico={{ nombre: form.nombreMedico, matricula: form.matriculaMedico }} onChange={updatePet} onMedicoChange={patch => setForm(f => ({ ...f, ...patch }))} onRemove={removePet} canRemove={form.mascotas.length>1}/>)}</>}<Actions/></div>}

      {activeTab === "pago" && <div className="space-y-4">{!completing ? <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#6B7A99]">El pago se registra en la segunda etapa, cuando el domiciliario haya llegado y se conozcan los servicios reales.</div> : <PaymentBlock pagos={form.pagos} mascotas={form.mascotas} valorTotal={form.valorTotal} onAddRow={addPay} onUpdateRow={updatePay} onRemoveRow={removePay}/>}<Actions/></div>}

      {activeTab === "observaciones" && <div className="space-y-4"><div><Label text="Observaciones / Notas"/><textarea value={form.observaciones} onChange={e=>upd("observaciones",e.target.value)} placeholder="Notas adicionales, indicaciones especiales, condiciones de la muestra..." rows={5} className={`${IC} resize-none`}/></div>{completing && <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[rgba(27,43,75,0.06)] space-y-2"><p className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest mb-3">Resumen de la orden</p>{[["Cliente",form.cliente||"—"],["Estado",form.estadoOrden],["Mascotas",String(form.mascotas.length)],["Servicios",String(form.mascotas.reduce((n,p)=>n+p.servicios.length,0))],["Domiciliario",form.domiciliario||"Sin domicilio"],["Valor total",form.valorTotal?`$${Number(form.valorTotal).toLocaleString("es-CO")}`:"—"],["Estado de pago",form.estadoPago]].map(([k,v])=><div key={k} className="flex justify-between text-[12px]"><span className="font-bold text-[#6B7A99]">{k}</span><span className="text-[#1B2B4B]">{v}</span></div>)}</div>}<Actions/></div>}
    </div>
  </div>;
}