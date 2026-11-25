import { useEffect, useMemo, useRef, useState } from "react";
import type { CourierExpense, FormOrden, Orden, PaymentRow, PetEntry, Responsable } from "../../types";
import { AlertCircle, ChevronDown, ChevronUp, Clock, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { CLIENTES, DOMICILIARIOS, EMPTY_FORM, IC, MEDIOS_PAGO, newCourierExpense, newPaymentRow, newPet, RESPONSABLES } from "../../constants";
import { BREEDS_BY_SPECIES, SPECIES } from "../../constants/breeds";
import { calculatePetServicesTotal, type ServicioCatalogo } from "../../constants/services";
import { calculatePaymentSummary } from "../../utils/payment";
import { formatResponsableNames } from "../../utils/responsables";
import { getOrCreateInvoiceNumber, reassignInvoiceNumber } from "../../utils/facturas";

function Label({ text, required, htmlFor }: { text: string; required?: boolean; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-[11px] font-bold text-[#6B7A99] mb-1 uppercase tracking-wider">{text}{required && <span className="text-rose-500 ml-0.5">*</span>}</label>;
}
function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={10} />{msg}</p> : null;
}

function ClientSearch({
  id,
  value,
  options,
  onChange,
  hasError,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="relative">
      <input
        id={id}
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setOpen(true);
          if (!nextQuery) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Buscar cliente / clínica..."
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`${id}-options`}
        className={`${IC} ${hasError ? "border-rose-400" : ""}`}
      />
      {open && (
        <div id={`${id}-options`} role="listbox" className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[rgba(27,43,75,0.1)] bg-white py-1 shadow-lg">
          {filtered.length > 0 ? filtered.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              key={option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setQuery(option);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-[12px] text-[#1B2B4B] hover:bg-[#F4F7FA]"
            >
              {option}
            </button>
          )) : (
            <p className="px-3 py-2 text-[12px] text-[#6B7A99]">No se encontraron clientes.</p>
          )}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "general", emoji: "📋", label: "General" },
  { id: "mascotas", emoji: "🐾", label: "Mascotas" },
  { id: "pago", emoji: "💳", label: "Pago" },
  { id: "observaciones", emoji: "📝", label: "Observaciones" },
];

function PetCard({ pet, index, catalogo, medico, onChange, onMedicoChange, onRemove, canRemove, shouldAutoFocus }: {
  pet: PetEntry; index: number; catalogo: Record<string, ServicioCatalogo[]>;
  medico: { nombre: string; matricula: string };
  onChange: (id: string, patch: Partial<PetEntry>) => void;
  onMedicoChange: (patch: { nombreMedico?: string; matriculaMedico?: string }) => void;
  onRemove: (id: string) => void; canRemove: boolean;
  shouldAutoFocus: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const breeds = BREEDS_BY_SPECIES[pet.especie] ?? [];
  const tipos = Object.keys(catalogo).filter((type) => type !== "Paquete" && type !== "Paquetes");
  const [tipo, setTipo] = useState("");
  const available = useMemo(() => (tipo ? catalogo[tipo] ?? [] : []).filter(s => `${s.nombre} ${s.categoria}`.toLowerCase().includes(search.toLowerCase())), [catalogo, tipo, search]);

  const update = (patch: Partial<PetEntry>) => onChange(pet.id, patch);

  useEffect(() => {
    if (!shouldAutoFocus) return;
    const frame = window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [shouldAutoFocus]);

  const toggleService = (service: ServicioCatalogo) => {
    const exists = pet.servicios.some(s => s.descripcion === service.nombre);
    const servicios = exists
      ? pet.servicios.filter(s => s.descripcion !== service.nombre)
      : [...pet.servicios, { id: crypto.randomUUID(), tipo, descripcion: service.nombre, categoria: service.categoria, precio: service.precio, cantidad: 1 }];
    update({ servicios });
  };

  return <div ref={cardRef} data-pet-card={pet.id} className="border border-[rgba(27,43,75,0.1)] rounded-2xl overflow-hidden scroll-mt-4">
    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" style={{ background: open ? "#F8FAFC" : "white" }} onClick={() => setOpen(o => !o)}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: "#2BB5C3" }}>{index + 1}</div>
      <span className="flex-1 text-[13px] font-semibold text-[#1B2B4B]"><span className="block">{pet.nombre || `Mascota ${index + 1}`}</span><span className="block text-[10px] font-mono font-normal text-[#6B7A99]">Orden {pet.numeroOrden || "Sin asignar"} · {pet.servicios.length} servicio{pet.servicios.length !== 1 ? "s" : ""}</span></span>
      {pet.estadoMuestra === "Coagulada" && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Coagulada</span>}
      {canRemove && <button type="button" onClick={e => { e.stopPropagation(); onRemove(pet.id); }} className="p-1 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"><Trash2 size={13}/></button>}
      {open ? <ChevronUp size={15} className="text-gray-400"/> : <ChevronDown size={15} className="text-gray-400"/>}
    </div>
    {open && <div className="p-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(400px,0.9fr)] gap-5 items-start border-t border-[rgba(27,43,75,0.06)]">
      <div className="space-y-5">
      <section className="space-y-3">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos de la mascota</p><p className="text-[10px] text-[#6B7A99]">Puedes guardar avances sin completar estos datos. El nombre y los servicios se solicitan al finalizar la orden.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-2"><Label text="N° Orden"/><input value={pet.numeroOrden} onChange={e => update({ numeroOrden: e.target.value })} placeholder="Ej: 106025" className={IC}/></div>
          <div className="sm:col-span-4"><Label text="Nombre de la Mascota"/><input ref={nameInputRef} value={pet.nombre} onChange={e => update({ nombre: e.target.value })} placeholder="Ej: Rocko" className={IC}/></div>
          <div className="sm:col-span-4"><Label text="Especie (opcional)"/><select value={pet.especie} onChange={e => update({ especie: e.target.value, raza: "" })} className={IC}><option value="">Seleccionar especie...</option>{SPECIES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="sm:col-span-4"><Label text="Raza (opcional)"/><select value={pet.raza} onChange={e => update({ raza: e.target.value })} disabled={!pet.especie} className={`${IC} disabled:opacity-50`}><option value="">{pet.especie ? "Seleccionar raza..." : "Seleccione primero la especie"}</option>{breeds.map(b => <option key={b}>{b}</option>)}</select></div>
          <div className="sm:col-span-3"><Label text="Sexo (opcional)"/><select value={pet.sexo} onChange={e => update({ sexo: e.target.value })} className={IC}><option value="">Seleccionar...</option><option>Macho</option><option>Hembra</option></select></div>
          <div className="sm:col-span-4"><Label text="Edad (opcional)"/><div className="grid grid-cols-2 gap-2"><label className="relative"><span className="absolute left-3 top-1.5 text-[9px] font-bold uppercase tracking-wide text-[#6B7A99]">Años</span><input type="number" min="0" value={pet.edadAnios} onChange={e => update({ edadAnios: e.target.value, edad: `${e.target.value || "0"} años, ${pet.edadMeses || "0"} meses` })} aria-label="Edad en años" className={`${IC} pt-4`}/></label><label className="relative"><span className="absolute left-3 top-1.5 text-[9px] font-bold uppercase tracking-wide text-[#6B7A99]">Meses</span><input type="number" min="0" max="11" value={pet.edadMeses} onChange={e => update({ edadMeses: e.target.value, edad: `${pet.edadAnios || "0"} años, ${e.target.value || "0"} meses` })} aria-label="Edad en meses" className={`${IC} pt-4`}/></label></div></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[92%]">
          <div><Label text="Estado de la muestra"/><select value={pet.estadoMuestra} onChange={e => update({ estadoMuestra: e.target.value as PetEntry["estadoMuestra"] })} className={IC}><option>Normal</option><option>Coagulada</option></select></div>
          <div><Label text="Hora de envío"/><input type="time" value={pet.horaEnvio} onChange={e => update({ horaEnvio: e.target.value })} className={IC}/></div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[rgba(27,43,75,0.08)] pt-5">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos del médico veterinario</p><p className="text-[10px] text-[#6B7A99]">Opcional. Puede dejar estos campos vacíos si la veterinaria no los envía.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label text="Nombre del médico veterinario"/><input value={medico.nombre} onChange={e => onMedicoChange({ nombreMedico: e.target.value })} placeholder="Nombre del médico" className={IC}/></div>
          <div><Label text="M.P."/><input value={medico.matricula} onChange={e => onMedicoChange({ matriculaMedico: e.target.value })} placeholder="MP-12345" className={IC}/></div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[rgba(27,43,75,0.08)] pt-5">
        <div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Datos del propietario</p><p className="text-[10px] text-[#6B7A99]">Opcional. Puede dejar estos campos vacíos si no fueron enviados.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2"><Label text="Propietario"/><input value={pet.propietario} onChange={e => update({ propietario: e.target.value })} placeholder="Nombre del dueño" className={IC}/></div>
          <div><Label text="N° Celular"/><input value={pet.telefono} onChange={e => update({ telefono: e.target.value })} placeholder="3001234567" className={IC}/></div>
          <div><Label text="Correo Electrónico"/><input value={pet.correo} onChange={e => update({ correo: e.target.value })} placeholder="correo@email.com" className={IC}/></div>
        </div>
      </section>

      </div>

      <div className="rounded-xl border border-[rgba(27,43,75,0.08)] p-4 lg:sticky lg:top-4">
        <div className="flex items-center justify-between mb-3"><div><p className="text-[12px] font-extrabold text-[#1B2B4B]">Servicios / Exámenes</p><p className="text-[10px] text-[#6B7A99]">Los servicios se registran para esta mascota.</p></div><span className="text-[11px] font-bold bg-[#2BB5C3]/10 text-[#2BB5C3] px-2 py-1 rounded-lg">{pet.servicios.length} seleccionados</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div><Label text="Tipo de servicio"/><select value={tipo} onChange={e => {setTipo(e.target.value); setSearch("")}} className={IC}><option value="">Seleccionar tipo...</option>{tipos.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="sm:col-span-2"><Label text="Buscar descripción"/><input value={search} onChange={e => setSearch(e.target.value)} disabled={!tipo} placeholder="Buscar examen..." className={`${IC} disabled:opacity-50`}/></div>
        </div>
        {tipo && <div className="max-h-36 overflow-y-auto space-y-2 rounded-xl bg-[#F8FAFC] p-3">{available.map(service => <label key={`${service.categoria}-${service.nombre}`} className="flex items-start gap-2 text-[12px] cursor-pointer"><input type="checkbox" checked={pet.servicios.some(s => s.descripcion === service.nombre)} onChange={() => toggleService(service)} className="mt-0.5 accent-[#2BB5C3]"/><span><span className="font-semibold">{service.nombre}</span> <span className="text-[#6B7A99]">({service.categoria}) · ${service.precio.toLocaleString("es-CO")}</span></span></label>)}</div>}
        {pet.servicios.length > 0 && <div className="mt-3 space-y-1.5">{pet.servicios.map(s => <div key={s.id} className="flex items-start justify-between gap-2 text-[11px] bg-white border border-[rgba(27,43,75,0.06)] rounded-lg px-3 py-2"><span className="min-w-0 wrap-break-word"><b>{s.tipo}</b> · {s.descripcion}</span><span className="font-bold shrink-0">${s.precio.toLocaleString("es-CO")}</span></div>)}<div className="flex items-center justify-between border-t border-[rgba(27,43,75,0.1)] pt-2 text-[12px] font-extrabold text-[#1B2B4B]"><span>Total de esta mascota</span><span>${calculatePetServicesTotal(pet.servicios).toLocaleString("es-CO")}</span></div></div>}
      </div>

    </div>}
  </div>;
}

function PaymentBlock({
  pagos,
  mascotas,
  valorTotal,
  cliente,
  fecha,
  factura,
  domiciliario,
  responsable,
  gastos,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onAddExpense,
  onUpdateExpense,
  onRemoveExpense,
}: {
  pagos: PaymentRow[];
  mascotas: PetEntry[];
  valorTotal: string;
  cliente: string;
  fecha: string;
  factura: string;
  domiciliario: string;
  responsable: string;
  gastos: CourierExpense[];
  onAddRow: () => void;
  onUpdateRow: (
    id: string,
    key: keyof PaymentRow,
    val: string
  ) => void;
  onRemoveRow: (id: string) => void;
  onAddExpense: () => void;
  onUpdateExpense: (id: string, key: keyof CourierExpense, value: string | boolean) => void;
  onRemoveExpense: (id: string) => void;
}) {
  const summary = calculatePaymentSummary(valorTotal, pagos, gastos);
  const formatMoney = (value: number) => `$${value.toLocaleString("es-CO")}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Valor de servicios
          </p>
          <p className="text-[18px] font-extrabold text-[#1B2B4B]">
            {formatMoney(summary.total)}
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Total recibido
          </p>
          <p className="text-[18px] font-extrabold text-emerald-600">
            {formatMoney(summary.received)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-[10px] font-bold text-blue-700 uppercase">
            Promociones
          </p>
          <p className="text-[18px] font-extrabold text-blue-700">
            {formatMoney(summary.promotions)}
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-[10px] font-bold text-blue-700 uppercase">Obsequios</p>
          <p className="text-[18px] font-extrabold text-blue-700">{formatMoney(summary.gifts)}</p>
        </div>

        <div className="bg-violet-50 rounded-xl p-3 border border-violet-200">
          <p className="text-[10px] font-bold text-violet-700 uppercase">Descuentos</p>
          <p className="text-[18px] font-extrabold text-violet-700">{formatMoney(summary.discounts)}</p>
        </div>

        <div
          className={`${
            summary.pending > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-emerald-50 border-emerald-200"
          } rounded-xl p-3 border`}
        >
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">
            Saldo
          </p>
          <p
            className={`text-[18px] font-extrabold ${
              summary.pending > 0 ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {formatMoney(summary.pending)}
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#6B7A99] uppercase">Estado del pago</p>
          <p className={`text-[13px] font-extrabold mt-2 ${summary.status === "Pagado" ? "text-emerald-700" : "text-amber-700"}`}>{summary.status}</p>
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
              mascota?.servicios
                .map(
                  (service) =>
                    `${service.descripcion} ($${service.precio.toLocaleString("es-CO")})`
                )
                .join(", ") || "Sin exámenes";
            const valorServiciosMascota = mascota
              ? calculatePetServicesTotal(mascota.servicios)
              : 0;
            const pagadoMascota = mascota
              ? pagos
                  .filter(
                    (payment) =>
                      payment.mascotaId === mascota.id &&
                      (payment.tipo ?? "Pago") === "Pago"
                  )
                  .reduce((sum, payment) => sum + Number(payment.valor || 0), 0)
              : 0;
            const cubiertoMascota = mascota
              ? calculatePaymentSummary(
                  valorServiciosMascota,
                  pagos.filter((payment) => payment.mascotaId === mascota.id),
                ).covered
              : 0;
            const saldoMascota = Math.max(
              0,
              valorServiciosMascota - cubiertoMascota
            );

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
                    onChange={(e) => {
                      const nextType = e.target.value;
                      onUpdateRow(row.id, "tipo", nextType);
                      if (nextType === "Pendiente") {
                        onUpdateRow(row.id, "valor", String(summary.pending));
                      }
                    }}
                    className={`${IC} w-full! h-10`}
                  >
                    <option value="Pago">Pago recibido</option>
                    <option value="Promoción">Promoción</option>
                    <option value="Obsequio">Obsequio / Gratis</option>
                    <option value="Descuento">Descuento</option>
                    <option value="Pendiente">Pendiente (calculado)</option>
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

                  <div>
                    <label className="block text-[10px] font-bold text-[#6B7A99] mb-1 uppercase">
                      {tipo === "Descuento" ? "Valor del descuento" : tipo === "Pendiente" ? "Saldo pendiente" : "Valor"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={tipo === "Pendiente" ? String(summary.pending) : row.valor}
                      onChange={(e) =>
                        onUpdateRow(row.id, "valor", e.target.value)
                      }
                      placeholder="$0"
                      disabled={tipo === "Pendiente"}
                      className={`${IC} w-full! h-10 disabled:cursor-not-allowed disabled:opacity-70`}
                    />
                  </div>

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
                  <div className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#6B7A99] space-y-1">
                    <strong>{mascota.nombre}</strong> · Orden{" "}
                    {mascota.numeroOrden || "Sin número"} · Exámenes:{" "}
                    {examenes}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                      <span>
                        Valor de servicios: ${valorServiciosMascota.toLocaleString("es-CO")}
                      </span>
                      <span className="text-emerald-700">
                        Dinero pagado: ${pagadoMascota.toLocaleString("es-CO")}
                      </span>
                      {cubiertoMascota > pagadoMascota && (
                        <span className="text-blue-700">
                          Beneficios / descuento: $
                          {(cubiertoMascota - pagadoMascota).toLocaleString("es-CO")}
                        </span>
                      )}
                      <span className={saldoMascota > 0 ? "text-amber-700" : "text-emerald-700"}>
                        {saldoMascota > 0 ? "Saldo pendiente" : "Saldo cubierto"}: $
                        {saldoMascota.toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-[#2BB5C3]/20 bg-[#F8FAFC] p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-extrabold text-[#1B2B4B]">DOMICILIARIO ASIGNADO</p>
            <p className="text-[10px] text-[#6B7A99]">Tomado automáticamente del tab General.</p>
          </div>
          <span className="text-[11px] font-bold text-[#2BB5C3]">{domiciliario || "Sin domiciliario asignado"}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px]">
          {[["Cliente", cliente || "—"], ["Fecha", fecha || "—"], ["Factura", factura], ["N° orden", mascotas[0]?.numeroOrden || "—"], ["Responsable", responsable || "—"]].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white border border-slate-100 p-2">
              <span className="block font-bold text-[#6B7A99] uppercase">{label}</span>
              <span className="block mt-1 text-[#1B2B4B] truncate">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[rgba(27,43,75,0.08)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-[#1B2B4B]">RESUMEN DE RECAUDO POR DOMICILIARIO</p>
            <p className="text-[10px] text-[#6B7A99]">Las promociones no incrementan el recaudo y los gastos autorizados solo afectan el neto.</p>
          </div>
          <span className="text-[12px] font-extrabold text-emerald-700">{formatMoney(summary.net)} neto</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          {[["Domicilios", domiciliario ? "1" : "0"], ...MEDIOS_PAGO.filter((medio) => medio !== "Transferencia").map((medio) => [medio, formatMoney(summary.byMethod[medio] ?? 0)]), ["Promociones", formatMoney(summary.promotions)], ["Gastos autorizados", formatMoney(summary.expenses)], ["Neto a entregar", formatMoney(summary.net)]].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#F8FAFC] p-2">
              <span className="block text-[#6B7A99]">{label}</span>
              <span className="block font-extrabold text-[#1B2B4B] mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-extrabold text-rose-800">GASTOS DEL DOMICILIARIO</p>
            <p className="text-[10px] text-rose-600">No alteran el valor de la factura ni el saldo del cliente.</p>
          </div>
          <button type="button" onClick={onAddExpense} className="text-[12px] font-bold text-rose-600">Agregar gasto</button>
        </div>
        {gastos.length === 0 && <p className="text-[11px] text-[#6B7A99]">No hay gastos registrados.</p>}
        {gastos.map((expense) => (
          <div key={expense.id} className="grid grid-cols-1 sm:grid-cols-[110px_1fr_130px_1fr_auto] gap-2 items-end">
            <div><Label text="Fecha"/><input type="date" value={expense.fecha} onChange={(e) => onUpdateExpense(expense.id, "fecha", e.target.value)} className={IC}/></div>
            <div><Label text="Concepto"/><input value={expense.concepto} onChange={(e) => onUpdateExpense(expense.id, "concepto", e.target.value)} placeholder="Ej: Café" className={IC}/></div>
            <div><Label text="Valor"/><input type="number" min="0" value={expense.valor} onChange={(e) => onUpdateExpense(expense.id, "valor", e.target.value)} className={IC}/></div>
            <div><Label text="Responsable"/><input value={expense.responsable} onChange={(e) => onUpdateExpense(expense.id, "responsable", e.target.value)} className={IC}/></div>
            <button type="button" onClick={() => onRemoveExpense(expense.id)} className="h-9 w-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><Trash2 size={13}/></button>
            <label className="sm:col-span-4 flex items-center gap-2 text-[11px] text-[#6B7A99]"><input type="checkbox" checked={expense.autorizado} onChange={(e) => onUpdateExpense(expense.id, "autorizado", e.target.checked)} /> Gasto autorizado</label>
            <input value={expense.observaciones} onChange={(e) => onUpdateExpense(expense.id, "observaciones", e.target.value)} placeholder="Observación" className={`${IC} sm:col-span-5`}/>
          </div>
        ))}
      </section>
    </div>
  );
}

interface OrderFormProps { editingId: string | null; initialForm?: FormOrden; initialTab?: "general" | "mascotas"; errors: Record<string,string>; catalogo: Record<string,ServicioCatalogo[]>; ordenes: Orden[]; responsables: Responsable[]; saving: boolean; onSave: (form: FormOrden, finalize?: boolean) => void; onClear: () => void; onCancelEdit: () => void; }

function removeLegacyCallTime(form: FormOrden): FormOrden {
  const cleaned = { ...form } as FormOrden & { horaLlamada?: unknown };
  delete cleaned.horaLlamada;
  return cleaned;
}

export default function OrderForm({ editingId, initialForm, initialTab = "general", errors, catalogo, ordenes, responsables, saving, onSave, onClear, onCancelEdit }: OrderFormProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [focusPetId, setFocusPetId] = useState<string | null>(null);
  const [form, setForm] = useState<FormOrden>(() => initialForm ? { ...removeLegacyCallTime(initialForm), mascotas: initialForm.mascotas.map(p => ({...p, servicios: p.servicios ?? []})), pagos: initialForm.pagos ?? [] } : EMPTY_FORM());
  const completing = Boolean(editingId);
  const formattedResponsables = useMemo(() => formatResponsableNames(responsables), [responsables]);
  const upd = <K extends keyof FormOrden>(k: K, v: FormOrden[K]) => setForm(f => ({...f,[k]:v}));
  const originalOrder = editingId ? ordenes.find((order) => order.id === editingId) : undefined;
  const factura = editingId
    ? originalOrder?.cliente === form.cliente && originalOrder.fecha === form.fecha
      ? originalOrder.factura
      : reassignInvoiceNumber(ordenes, editingId, form.cliente, form.fecha)
    : getOrCreateInvoiceNumber(ordenes, form.cliente, form.fecha);
  const paymentStatus = calculatePaymentSummary(form.valorTotal, form.pagos).status;

  useEffect(() => {
    const total = form.mascotas.reduce((sum,p) => sum + calculatePetServicesTotal(p.servicios), 0);
    const totalValue = total ? String(total) : "";
    const status = calculatePaymentSummary(total, form.pagos).status;
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

  useEffect(() => {
    if (errors.mascotas || errors.servicios) {
      setActiveTab("mascotas");
    } else if (errors.pagos) {
      setActiveTab("pago");
    } else if (errors.cliente) {
      setActiveTab("general");
    }
  }, [errors]);

  const updatePet = (id:string, patch:Partial<PetEntry>) => setForm(f => ({...f, mascotas:f.mascotas.map(p => p.id === id ? {...p,...patch}:p)}));
  const addPet = () => {
    const pet = newPet();
    setFocusPetId(pet.id);
    setForm(f => ({...f, mascotas:[pet, ...f.mascotas]}));
  };
  const removePet = (id:string) => setForm(f => ({
    ...f,
    mascotas: f.mascotas.filter(p => p.id !== id),
    pagos: f.pagos.filter(p => p.mascotaId !== id),
  }));
  const addPay = () => setForm((form) => ({
    ...form,
    pagos: [...form.pagos, { ...newPaymentRow(), cliente: form.cliente, domiciliario: form.domiciliario, responsable: form.responsable }],
  }));
  const updatePay = (id:string,key:keyof PaymentRow,val:string) => setForm(f => ({...f,pagos:f.pagos.map(p=>p.id===id?{...p,[key]:val}:p)}));
  const removePay = (id:string) => setForm(f => ({...f,pagos:f.pagos.filter(p=>p.id!==id)}));
  const addExpense = () => setForm(f => ({ ...f, gastosDomiciliario: [...(f.gastosDomiciliario ?? []), newCourierExpense(f.domiciliario, editingId ?? "")] }));
  const updateExpense = (id: string, key: keyof CourierExpense, value: string | boolean) => setForm(f => ({ ...f, gastosDomiciliario: (f.gastosDomiciliario ?? []).map(expense => expense.id === id ? { ...expense, [key]: value } : expense) }));
  const removeExpense = (id: string) => setForm(f => ({ ...f, gastosDomiciliario: (f.gastosDomiciliario ?? []).filter(expense => expense.id !== id) }));
  const clear = () => { setForm(EMPTY_FORM()); setFocusPetId(null); setActiveTab("general"); onClear(); };

  const tabHasError = (id:string) => id === "general" ? Boolean(errors.cliente) : id === "mascotas" ? Boolean(errors.mascotas || errors.servicios) : id === "pago" ? Boolean(errors.pagos) : false;
  const save = (finalize=false) => onSave(form, finalize);

  const renderActions = (showSave = true) => <div className="flex items-center gap-3 pt-4 mt-4 border-t border-[rgba(27,43,75,0.06)]">{showSave && <button type="button" disabled={saving} onClick={() => save(false)} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl disabled:cursor-not-allowed disabled:opacity-60" style={{background:"#2BB5C3",boxShadow:"0 4px 12px rgba(43,181,195,0.35)"}}><Save size={15}/>{saving ? "Guardando..." : completing ? "Guardar avances" : "Guardar solicitud"}</button>}<button type="button" disabled={saving} onClick={clear} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[13px] font-bold px-4 py-2.5 rounded-xl disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw size={14}/>Limpiar</button>{completing && <button type="button" disabled={saving} onClick={() => {clear();onCancelEdit()}} className="flex items-center gap-2 border border-[rgba(27,43,75,0.1)] text-[#6B7A99] text-[13px] font-bold px-4 py-2.5 rounded-xl disabled:cursor-not-allowed disabled:opacity-60"><X size={14}/>Cancelar</button>}</div>;

  return <div className="bg-white rounded-2xl border border-[rgba(27,43,75,0.06)] overflow-hidden" style={{boxShadow:"0 1px 6px rgba(27,43,75,0.06)"}}>
    <div className="px-4 py-2.5 flex items-center justify-between" style={{background:"linear-gradient(135deg,#1B2B4B 0%,#243861 100%)"}}><div><h2 className="text-white font-extrabold text-[15px] tracking-tight">{completing ? "Completar Orden de Servicio" : "Nueva Solicitud de Servicio"}</h2><p className="text-white/60 text-[11px] mt-0.5">{completing ? "La solicitud fue recibida. Complete mascotas, exámenes, pago y observaciones." : "Registre la información general ahora; complete el resto cuando llegue el domiciliario."}</p></div><div className="flex items-center gap-2">{completing && <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-amber-400/20 text-amber-200">{form.estadoOrden}</span>}<span className="text-[11px] font-bold text-[#2BB5C3] bg-[#2BB5C3]/15 px-3 py-1.5 rounded-lg font-mono">{factura || "Factura pendiente"}</span></div></div>
    <div className="flex border-b border-[rgba(27,43,75,0.08)] px-4 pt-2 gap-1 overflow-x-auto">{TABS.map(tab => <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-[13px] font-bold whitespace-nowrap border-b-2 focus-visible:outline focus-visible:outline-[#2BB5C3] ${activeTab===tab.id?"border-[#2BB5C3] text-[#2BB5C3] bg-[#2BB5C3]/5":"border-transparent text-[#6B7A99]"}`}><span>{tab.emoji}</span>{tab.label}{tab.id==="mascotas"&&form.mascotas.length>0&&<span className="text-[10px] font-bold bg-[#2BB5C3]/15 text-[#2BB5C3] px-1.5 py-0.5 rounded-full">{form.mascotas.length}</span>}{tabHasError(tab.id)&&<span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>}</button>)}</div>
    <div className="p-4">
      {activeTab === "general" && <div className="space-y-3"><div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2">
        <div><Label text="Fecha" required htmlFor="service-date"/><input id="service-date" type="date" value={form.fecha} onChange={e=>upd("fecha",e.target.value)} className={`${IC} h-9 px-2 py-1 text-xs`}/></div>
        <div><Label text="Hora de solicitud" required htmlFor="service-request-time"/><div className="relative"><Clock size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B7A99]"/><input id="service-request-time" type="time" value={form.horaSolicitud} onChange={e=>upd("horaSolicitud",e.target.value)} className={`${IC} h-9 pl-8 pr-2 py-1 text-xs`} /></div></div>
        <div><Label text="Hora de llegada" htmlFor="service-arrival-time"/><input id="service-arrival-time" type="time" value={form.horaLlegada} onChange={e=>upd("horaLlegada",e.target.value)} className={`${IC} h-9 px-2 py-1 text-xs`}/></div>
        <div><Label text="Responsable" required htmlFor="service-responsible"/><select id="service-responsible" value={form.responsable} onChange={e=>upd("responsable",e.target.value)} className={`${IC} h-9 px-2 py-1 text-xs`}>{!responsables.some(r=>r.nombre===form.responsable) && <option value={form.responsable}>{form.responsable}</option>}{responsables.length > 0 ? responsables.map(r=><option key={r.id} value={r.nombre}>{formattedResponsables.get(r.id) ?? r.nombre}</option>) : RESPONSABLES.map(r=><option key={r}>{r}</option>)}</select></div>
        <div><Label text="Prioridad" htmlFor="service-priority"/><select id="service-priority" value={form.prioridad} onChange={e=>upd("prioridad",e.target.value as FormOrden["prioridad"])} className={`${IC} h-9 px-2 py-1 text-xs`}><option>Normal</option><option>Prioritaria</option><option>Urgente</option></select></div>
        <div className="sm:col-span-2"><Label text="Veterinaria" required htmlFor="service-veterinary"/><ClientSearch id="service-veterinary" key={form.cliente} value={form.cliente} options={CLIENTES} onChange={(cliente) => upd("cliente", cliente)} hasError={Boolean(errors.cliente)}/><FieldErr msg={errors.cliente}/></div>
        <div><Label text="Domiciliario" htmlFor="service-courier"/><select id="service-courier" value={form.domiciliario} onChange={e=>upd("domiciliario",e.target.value)} className={`${IC} h-9 px-2 py-1 text-xs`}><option value="">Sin domicilio</option>{DOMICILIARIOS.map(d=><option key={d}>{d}</option>)}</select></div>
      </div><div className="rounded-lg bg-amber-50 border border-amber-100 p-2 text-[11px] text-amber-800"><b>Pendiente de recepción:</b> esta solicitud puede guardarse sin mascotas, servicios ni pago. Esos datos se completan cuando llegue el domiciliario.</div>{renderActions()}</div>}

      {activeTab === "mascotas" && <div className="space-y-4">{!completing && <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#6B7A99] border border-[rgba(27,43,75,0.06)]">Primero guarda la solicitud general. Cuando llegue el domiciliario, abre la solicitud desde el historial y pulsa <b>Completar</b> para registrar las mascotas y sus exámenes.</div>}{completing && <><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[13px] text-[#6B7A99]"><span className="font-bold text-[#1B2B4B]">{form.mascotas.length}</span> mascota{form.mascotas.length!==1?"s":""} en esta orden</p><p className="text-[10px] text-[#6B7A99]">Veterinaria: <span className="font-semibold text-[#1B2B4B]">{form.cliente || "Sin seleccionar"}</span></p><p className="text-[10px] text-[#6B7A99]">Una orden puede contener varias mascotas y varios servicios por mascota.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={addPet} className="flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2 rounded-xl" style={{background:"#2BB5C3"}}><Plus size={15}/>Agregar mascota</button><button type="button" disabled={saving} onClick={() => save(false)} className="flex items-center gap-2 text-white text-[13px] font-bold px-4 py-2 rounded-xl disabled:cursor-not-allowed disabled:opacity-60" style={{background:"#1B2B4B"}}><Save size={15}/>{saving ? "Guardando..." : "Guardar avances"}</button></div></div>{(errors.mascotas || errors.servicios) && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700"><AlertCircle size={14} className="mt-0.5 shrink-0"/><div><p className="font-bold">Complete los datos antes de finalizar</p>{errors.mascotas && <p>{errors.mascotas}</p>}{errors.servicios && <p>{errors.servicios}</p>}</div></div>}{form.mascotas.length===0&&<div className="border border-dashed rounded-xl p-8 text-center text-[12px] text-[#6B7A99]">Aún no se han registrado mascotas.</div>}{form.mascotas.map((pet,i)=><PetCard key={pet.id} pet={pet} index={i} catalogo={catalogo} medico={{ nombre: form.nombreMedico, matricula: form.matriculaMedico }} onChange={updatePet} onMedicoChange={patch => setForm(f => ({ ...f, ...patch }))} onRemove={removePet} canRemove={form.mascotas.length>1} shouldAutoFocus={pet.id === focusPetId}/>)}</>}{renderActions(!completing)}</div>}

      {activeTab === "pago" && <div className="space-y-4">{!completing ? <div className="rounded-xl bg-[#F8FAFC] p-4 text-[12px] text-[#6B7A99]">El pago se registra en la segunda etapa, cuando el domiciliario haya llegado y se conozcan los servicios reales.</div> : <PaymentBlock pagos={form.pagos} mascotas={form.mascotas} valorTotal={form.valorTotal} cliente={form.cliente} fecha={form.fecha} factura={factura} domiciliario={form.domiciliario} responsable={form.responsable} gastos={form.gastosDomiciliario ?? []} onAddRow={addPay} onUpdateRow={updatePay} onRemoveRow={removePay} onAddExpense={addExpense} onUpdateExpense={updateExpense} onRemoveExpense={removeExpense} />}{completing && paymentStatus === "Pagado" && <button type="button" disabled={saving} onClick={() => save(true)} className="flex items-center gap-2 text-white text-[13px] font-bold px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"><Save size={15}/>Finalizar orden</button>}{renderActions()}</div>}

      {activeTab === "observaciones" && <div className="space-y-4"><div><Label text="Observaciones / Notas"/><textarea value={form.observaciones} onChange={e=>upd("observaciones",e.target.value)} placeholder="Notas adicionales, indicaciones especiales, condiciones de la muestra..." rows={5} className={`${IC} resize-none`}/></div>{completing && <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[rgba(27,43,75,0.06)] space-y-2"><p className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest mb-3">Resumen de la orden</p>{[["Cliente",form.cliente||"—"],["Estado",form.estadoOrden],["Mascotas",String(form.mascotas.length)],["Servicios",String(form.mascotas.reduce((n,p)=>n+p.servicios.length,0))],["Domiciliario",form.domiciliario||"Sin domicilio"],["Valor total",form.valorTotal?`$${Number(form.valorTotal).toLocaleString("es-CO")}`:"—"],["Estado de pago",form.estadoPago]].map(([k,v])=><div key={k} className="flex justify-between text-[12px]"><span className="font-bold text-[#6B7A99]">{k}</span><span className="text-[#1B2B4B]">{v}</span></div>)}</div>}{renderActions()}</div>}
    </div>
  </div>;
}