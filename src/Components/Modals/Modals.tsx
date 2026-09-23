import { AlertTriangle, ClipboardList, PawPrint, X } from "lucide-react";
import React, { useState } from "react";
import type { Orden } from "../../types";


function Row({label, value, accent}: {label: string; value: string; accent?: boolean}) {
    return(
        <div className="flex justify-between py-1.5 border-b border-[rgba(27, 43, 75, 0.05)] last:border-0">
            <span className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider">{label}</span>
            <span className={`text-[12px] font-semibold text-right max-w-[55%] ${accent ? "text-[#2BB5C3]": "text-[#1B2B4B]"}`}>{value || "—"}</span>
        </div>
    );
}


function Section({emoji, title, children}: {emoji: string; title: string; children: React.ReactNode}) {
    return(
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
                <span>{emoji}</span>
                <span className="text-[11px] font-bold text-[#1B2B4B] uppercase tracking-widest">{title}</span>
                <div className="flex-1 h-px bg-[rgba(27, 43, 75, 0.08)]"/>
            </div>
            {children}
        </div>
    )
}

export function ViewOrderModal({orden, onClose}: {orden: Orden; onClose: () => void}) {
    const totalPagado = orden.pagos
      .filter((p) => (p.tipo ?? "Pago") === "Pago")
      .reduce((a, p) => a + Number(p.valor || 0), 0);
    const totalCubierto = orden.pagos.reduce((a, p) => a + Number(p.valor || 0), 0);
    const pendiente = Math.max(0, Number(orden.valorTotal || 0)-totalCubierto);

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: "rgba(27, 43, 75, 0.55)"}}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="px-6 py-4 flex items-center justify-between" style={{background: "linear-gradient(135deg, #1B2B4B, #243861)"}}>
                    <div>
                        <h3 className="text-white font-extrabold text-[15px]">Detalle de la Orden</h3>
                        <p className="text-white/45 text-[11px] mt-0.5 font-mono">{orden.factura}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {
                          (orden.prioridad === "Prioritaria" || orden.prioridad === "Urgente") && (
                              <span className="text-[11px] font-bold bg-rose-500/20 text-rose-300 px-2 py-1 rounded-lg">🔴 {orden.prioridad}</span>
                          )}
                          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                              <X size={15}/>
                          </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-1">
                    <Section emoji="📋" title="Información General">
                          <Row label="Fecha" value={orden.fecha}/>
                        <Row label="Hora de Solicitud" value={orden.horaSolicitud}/>
                          <Row label="N° Orden" value={orden.numeroOrden}/>
                          <Row label="Factura" value={orden.factura}/>
                          <Row label="Responsable" value={orden.responsable}/>
                          <Row label="Estado de la orden" value={orden.estadoOrden}/>
                    </Section>

                    <Section emoji="🏥" title="Cliente">
                        <Row label="Cliente" value={orden.cliente}/>
                    </Section>

                    <Section emoji={<ClipboardList size={13} /> as unknown as string} title="Servicio">
                          <Row label="Tipo" value={orden.tipoServicio} />
                          <Row label="Descripción" value={orden.descripcionServicio} />
                          <Row label="Cantidad" value={orden.cantidad} />
                    </Section>

                    <Section emoji="🩺" title="Médico Veterinario">
                          <Row label="Nombre"    value={orden.nombreMedico} />
                          <Row label="Matrícula" value={orden.matriculaMedico} />
                    </Section>

                    <Section emoji="🐾" title={`Mascotas (${orden.mascotas.length})`}>
                        {orden.mascotas.map((pet, i) => (
                          <div key={pet.id} className="mb-3 p-3 bg-[#F8FAFC] rounded-xl border border-[rgba(27,43,75,0.06)]">
                            <p className="text-[12px] font-bold text-[#1B2B4B] mb-1.5 flex items-center gap-2">
                              <PawPrint size={12} style={{ color: "#2BB5C3" }} />
                              Mascota {i + 1}: {pet.nombre || "Sin nombre"} · Orden {pet.numeroOrden || orden.numeroOrden}
                              {pet.estadoMuestra === "Coagulada" && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold ml-auto">Coagulada</span>
                              )}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                              {[
                                ["Propietario", pet.propietario], ["Teléfono", pet.telefono],
                                ["Especie", pet.especie], ["Raza", pet.raza],
                                ["Sexo", pet.sexo], ["Edad", pet.edad || `${pet.edadAnios || "0"} años, ${pet.edadMeses || "0"} meses`],
                                ["Hr. Envío", pet.horaEnvio],
                              ].map(([k, v]) => <Row key={k} label={k} value={v} />)}
                            </div>
                            {pet.servicios?.length > 0 && (
                              <div className="mt-3 rounded-xl bg-white border border-[rgba(27,43,75,0.06)] p-3">
                                <p className="text-[10px] font-bold text-[#6B7A99] uppercase tracking-wider mb-2">Servicios / Exámenes ({pet.servicios.length})</p>
                                {pet.servicios.map((servicio) => (
                                  <div key={servicio.id} className="flex justify-between gap-3 text-[11px] py-1 border-b border-[rgba(27,43,75,0.04)] last:border-0">
                                    <span className="text-[#1B2B4B]">{servicio.tipo} · {servicio.descripcion}</span>
                                    <span className="font-bold text-[#1B2B4B]">${servicio.precio.toLocaleString("es-CO")}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </Section>

                    <Section emoji="🚗" title="Domicilio y Horarios">
                      <Row label="Domiciliario"  value={orden.domiciliario} />
                      <Row label="Hora Llamada"  value={orden.horaLlamada} />
                      <Row label="Hora Llegada"  value={orden.horaLlegada} />
                      <Row label="Prioridad"     value={orden.prioridad} />
                    </Section>

                    <Section emoji="💳" title="Pagos">
                        {orden.pagos.filter((p) => p.medio || p.valor).map((p, i) => (
                          <div key={p.id} className="flex justify-between py-1.5 border-b border-[rgba(27,43,75,0.05)]">
                            <span className="text-[11px] font-bold text-[#6B7A99]">
                              {p.tipo ?? "Pago"} · {p.medio || `Movimiento ${i + 1}`}
                              {p.concepto ? ` · ${p.concepto}` : ""}
                              {p.mascotaId ? ` · ${orden.mascotas.find((pet) => pet.id === p.mascotaId)?.nombre || "Mascota"}` : ""}
                            </span>
                            <span className="text-[12px] font-semibold text-[#1B2B4B]">${Number(p.valor || 0).toLocaleString("es-CO")}</span>
                          </div>
                        ))}
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {[
                            ["Total Pagado", `$${totalPagado.toLocaleString("es-CO")}`, "text-emerald-600"],
                            ["Pendiente",    `$${pendiente.toLocaleString("es-CO")}`,   pendiente > 0 ? "text-amber-500" : "text-emerald-600"],
                            ["Estado",       orden.estadoPago,                           orden.estadoPago === "Pagado" ? "text-emerald-600" : "text-amber-500"],
                          ].map(([k, v, cls]) => (
                            <div key={k} className="bg-[#F4F7FA] rounded-xl p-2 text-center">
                              <p className="text-[10px] font-bold text-[#6B7A99] uppercase">{k}</p>
                              <p className={`text-[13px] font-extrabold mt-0.5 ${cls}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                    </Section>

                    {orden.observaciones && (
                        <Section emoji="📝" title="Observaciones">
                          <p className="text-[13px] text-[#6B7A99] bg-[#F8FAFC] rounded-xl p-3 leading-relaxed">{orden.observaciones}</p>
                        </Section>
                    )}

                    {orden.auditoria.length > 0 && (
                        <Section emoji="🔍" title={`Auditoría (${orden.auditoria.length} cambio${orden.auditoria.length !== 1 ? "s" : ""})`}>
                          {orden.auditoria.map((a, i) => (
                            <div key={i} className="mb-2 p-3 bg-[#FFF8F0] rounded-xl border border-amber-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-amber-700">{a.campo}</span>
                                <span className="text-[10px] text-[#6B7A99]">{a.fecha} {a.hora} · {a.usuario}</span>
                              </div>
                              <p className="text-[11px] text-[#6B7A99]">
                                <span className="line-through">{a.valorAnterior}</span>
                                <span className="mx-1.5">→</span>
                                <span className="font-semibold text-[#1B2B4B]">{a.valorNuevo}</span>
                              </p>
                              <p className="text-[11px] text-[#6B7A99] mt-1 italic">Motivo: {a.motivo}</p>
                            </div>
                          ))}
                        </Section>
                    )}
                </div>
            </div>
        </div>
    )
}


export function AuditModal({
  changes, onConfirm, onCancel,
}: {
  changes: string[];
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [touched, setTouched] = useState(false);
  const hasError = touched && !motivo.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(27,43,75,0.55)" }}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#1B2B4B] text-[15px]">Cambios detectados</h3>
            <p className="text-[#6B7A99] text-[12px] mt-0.5">Es necesario registrar el motivo de los cambios</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-100">
          <p className="text-[11px] font-bold text-amber-700 mb-1.5 uppercase tracking-wider">Campos modificados</p>
          {changes.map((c) => (
            <p key={c} className="text-[12px] text-amber-800 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> {c}
            </p>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-[11px] font-bold text-[#6B7A99] uppercase tracking-wider mb-1.5">
            Motivo del cambio <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Describa el motivo de la modificación..."
            rows={3}
            className={`w-full px-3 py-2 text-sm bg-[#F4F7FA] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2BB5C3]/25 focus:border-[#2BB5C3] transition-colors placeholder:text-gray-400 text-[#1B2B4B] resize-none ${hasError ? "border-rose-400" : "border-[rgba(27,43,75,0.1)]"}`}
          />
          {hasError && <p className="text-[11px] text-rose-500 mt-1">El motivo es obligatorio</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-[rgba(27,43,75,0.1)] text-[#6B7A99] text-[13px] font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              setTouched(true);
              if (motivo.trim()) onConfirm(motivo.trim());
            }}
            className="flex-1 text-white text-[13px] font-bold py-2.5 rounded-xl transition-colors"
            style={{ background: "#2BB5C3" }}
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({cliente, onConfirm, onCancel}: {cliente: string; onConfirm: () => void; onCancel: () => void;}) {
    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background: "rgba(27, 43, 75, 0.55)"}}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-rose-500"/>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#1B2B4B] text-[15px]">Eliminar Orden</h3>
                      <p className="text-[#6B7A99] text-[12px]">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                <p className="text-[13px] text-[#6B7A99] mb-5">
                    ¿Desea eliminar la orden de {" "}
                    <span className="font-bold text-[#1B2B4B]">{cliente || "este cliente"}</span>?
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 border border-[rgba(27, 43, 75, 0.1)] text-[#6B7A99] text-[13px] font-bold py-2 rounded-xl hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="flex-1 bg-rose-500 text-white text-[13px] font-bold py-2 rounded-xl hover:bg-rose-600 transition-colors">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    )
}