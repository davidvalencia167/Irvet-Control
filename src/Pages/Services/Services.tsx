import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import MainLayout from "../../Layout/MainLayout";
import type { AuditEntry, FormOrden, Orden, Responsable } from "../../types";
import OrderForm from "../../Components/OrderForm/OrderForm";
import {
  AuditModal,
  ConfirmModal,
  ViewOrderModal,
} from "../../Components/Modals/Modals";
import ServiceHistory from "../../Components/ServiceHistory/ServiceHistory";
import type { SidebarItem } from "../../Components/Slidebar/Slidebar";
import type { ServicioCatalogo } from "../../constants/services";
import type { DailyTask } from "../../types/tasks";
import { api } from "../../api/resources";
import { calculatePaymentSummary } from "../../utils/payment";
import { findInvoiceConflicts, getOrCreateInvoiceNumber, reassignInvoiceNumber } from "../../utils/facturas";

interface ServicesProps {
  activeModule?: string;
  onSelectModule?: (moduleKey: string) => void;
  userName?: string;
  onLogout?: () => void;
  sidebarItems?: SidebarItem[];
  catalogo: Record<string, ServicioCatalogo[]>;
  ordenes: Orden[];
  responsables: Responsable[];
  tasks: DailyTask[];
  onOrdenesChange: Dispatch<SetStateAction<Orden[]>>;
}

function detectChanges(original: Orden, updated: FormOrden): string[] {
  const changes: string[] = [];
  if (
    original.tipoServicio !== updated.tipoServicio ||
    original.descripcionServicio !== updated.descripcionServicio ||
    JSON.stringify(original.mascotas.map((p) => p.servicios)) !==
      JSON.stringify(updated.mascotas.map((p) => p.servicios))
  )
    changes.push("Servicios / exámenes");
  if (JSON.stringify(original.pagos) !== JSON.stringify(updated.pagos))
    changes.push("Método(s) de pago");
  if (JSON.stringify(original.gastosDomiciliario ?? []) !== JSON.stringify(updated.gastosDomiciliario ?? []))
    changes.push("Gastos del domiciliario");
  if (original.domiciliario !== updated.domiciliario)
    changes.push("Domiciliario");
  if (original.valorTotal !== updated.valorTotal)
    changes.push("Valor total de la orden");
  if (
    JSON.stringify(
      original.mascotas.map((p) => ({ id: p.id, nombre: p.nombre })),
    ) !==
    JSON.stringify(
      updated.mascotas.map((p) => ({ id: p.id, nombre: p.nombre })),
    )
  )
    changes.push("Mascotas");
  if (original.movimiento !== updated.movimiento)
    changes.push("Movimiento (Ingreso/Gasto)");
  return [...new Set(changes)];
}

function auditValues(
  original: Orden,
  updated: FormOrden,
  campo: string,
): [string, string] {
  if (campo === "Servicios / exámenes")
    return [
      JSON.stringify(
        original.mascotas.map((p) => ({
          mascota: p.nombre,
          servicios: p.servicios.map((s) => s.descripcion),
        })),
      ),
      JSON.stringify(
        updated.mascotas.map((p) => ({
          mascota: p.nombre,
          servicios: p.servicios.map((s) => s.descripcion),
        })),
      ),
    ];
  if (campo === "Método(s) de pago")
    return [JSON.stringify(original.pagos), JSON.stringify(updated.pagos)];
  if (campo === "Gastos del domiciliario")
    return [JSON.stringify(original.gastosDomiciliario ?? []), JSON.stringify(updated.gastosDomiciliario ?? [])];
  if (campo === "Domiciliario")
    return [original.domiciliario, updated.domiciliario];
  if (campo === "Valor total de la orden")
    return [original.valorTotal, updated.valorTotal];
  if (campo === "Mascotas")
    return [
      JSON.stringify(original.mascotas.map((p) => p.nombre)),
      JSON.stringify(updated.mascotas.map((p) => p.nombre)),
    ];
  if (campo === "Movimiento (Ingreso/Gasto)")
    return [original.movimiento, updated.movimiento];
  return ["", ""];
}

function getCoveredAmount(form: FormOrden): number {
  return calculatePaymentSummary(form.valorTotal, form.pagos).covered;
}

function normalizePetAges(form: FormOrden): FormOrden {
  return {
    ...form,
    mascotas: form.mascotas.map((pet) => {
      const edadAnios = pet.edadAnios.trim() || "0";
      const edadMeses = pet.edadMeses.trim() || "0";

      return {
        ...pet,
        edadAnios,
        edadMeses,
        edad: `${edadAnios} años, ${edadMeses} meses`,
      };
    }),
  };
}

export default function Services({
  activeModule,
  onSelectModule,
  userName,
  onLogout,
  sidebarItems,
  catalogo,
  ordenes,
  responsables,
  tasks,
  onOrdenesChange,
}: ServicesProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewOrden, setViewOrden] = useState<Orden | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [auditState, setAuditState] = useState<{
    changes: string[];
    pendingForm: FormOrden;
    originalOrden: Orden;
    finalize: boolean;
  } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const invoiceOrdersRef = useRef<Orden[]>(ordenes);
  const pendingOrdersRef = useRef(new Map<string, Orden>());
  const invoiceConflicts = findInvoiceConflicts(ordenes);

  useEffect(() => {
    const pendingIds = new Set(pendingOrdersRef.current.keys());
    invoiceOrdersRef.current = [
      ...pendingOrdersRef.current.values(),
      ...ordenes.filter((order) => !pendingIds.has(order.id)),
    ];
  }, [ordenes]);

  const validate = (form: FormOrden, finalize = false) => {
    const e: Record<string, string> = {};
    if (!form.cliente) e.cliente = "Requerido";
    if (form.pagos.some((payment) =>
      payment.mascotaId &&
      !form.mascotas.some((pet) => pet.id === payment.mascotaId)
    )) {
      e.pagos = "Hay un pago asociado a una mascota eliminada.";
    }
    if (finalize) {
      if (form.mascotas.length === 0)
        e.mascotas = "Agregue al menos una mascota antes de finalizar.";
      if (form.mascotas.some((p) => !p.nombre.trim()))
        e.mascotas = "Todas las mascotas deben tener nombre.";
      if (form.mascotas.some((p) => p.servicios.length === 0))
        e.servicios = "Cada mascota debe tener al menos un servicio/examen.";
      if (
        form.pagos.some(
          (p) =>
            Number(p.valor || 0) <= 0 ||
            ((p.tipo ?? "Pago") === "Pago" && !p.medio),
        )
      ) {
        e.pagos = "Complete correctamente los movimientos de pago.";
      }

      if (
        getCoveredAmount(form) > Number(form.valorTotal || 0) &&
        Number(form.valorTotal || 0) > 0
      ) {
        e.pagos = "El total cubierto no puede superar el valor de la orden.";
      }
    }
    return e;
  };

  const commitEdit = async (
    id: string,
    form: FormOrden,
    audit: AuditEntry[],
    finalize: boolean,
  ) => {
    const original = ordenes.find((order) => order.id === id);
    if (!original) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const payload = normalizePetAges(form);
    const updatedOrder: Orden = {
      ...payload,
      id,
      factura:
        original.cliente === payload.cliente && original.fecha === payload.fecha
          ? original.factura
          : reassignInvoiceNumber(ordenes, id, payload.cliente, payload.fecha),
      estadoOrden: finalize
        ? "Completada"
        : original.estadoOrden === "Pendiente de recepción"
          ? "En proceso"
          : original.estadoOrden,
      auditoria: [...original.auditoria, ...audit],
    };
    try {
      const result = await api.updateOrder(updatedOrder);
      invoiceOrdersRef.current = invoiceOrdersRef.current.map((order) =>
        order.id === id ? result.order : order,
      );
      onOrdenesChange((prev) => prev.map((order) => order.id === id ? result.order : order));
      setEditingId(null);
      setFormKey((k) => k + 1);
      setAuditState(null);
    } catch (error) {
      console.error("No se pudo guardar la modificación de la orden", error);
      window.alert(error instanceof Error ? error.message : "No se pudo guardar la modificación.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleSave = async (form: FormOrden, finalize = false) => {
    const errs = validate(form, finalize);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (editingId) {
      const original = ordenes.find((o) => o.id === editingId);
      if (!original) return;
      const changes = detectChanges(original, form);
      if (finalize && changes.length) {
        setAuditState({
          changes,
          pendingForm: form,
          originalOrden: original,
          finalize,
        });
        return;
      }
      await commitEdit(editingId, form, [], finalize);
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    // The API currently stores a clinic name in `cliente`; use it as the key until it exposes a veterinary ID.
    const invoice = getOrCreateInvoiceNumber(invoiceOrdersRef.current, form.cliente, form.fecha);
    const newOrder: Orden = {
      ...form,
      id: crypto.randomUUID(),
      factura: invoice,
      numeroOrden: form.numeroOrden || "",
      mascotas: [],
      pagos: [],
      valorTotal: "",
      cantidad: "0",
      tipoServicio: "",
      descripcionServicio: "",
      serviciosSeleccionados: [],
      estadoPago: "Pendiente por pago",
      estadoOrden: "Pendiente de recepción",
      auditoria: [],
    };
    pendingOrdersRef.current.set(newOrder.id, newOrder);
    invoiceOrdersRef.current = [newOrder, ...invoiceOrdersRef.current];
    try {
      const result = await api.saveOrder(newOrder);
      pendingOrdersRef.current.delete(newOrder.id);
      invoiceOrdersRef.current = [
        result.order,
        ...invoiceOrdersRef.current.filter((order) => order.id !== newOrder.id),
      ];
      onOrdenesChange((prev) => [result.order, ...prev]);
      setFormKey((k) => k + 1);
      setEditingId(null);
    } catch (error) {
      pendingOrdersRef.current.delete(newOrder.id);
      invoiceOrdersRef.current = invoiceOrdersRef.current.filter((order) => order.id !== newOrder.id);
      console.error("No se pudo guardar la solicitud", error);
      window.alert(error instanceof Error ? error.message : "No se pudo guardar la solicitud.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleAuditConfirm = (motivo: string) => {
    if (!auditState) return;
    const now = new Date();
    const entries: AuditEntry[] = auditState.changes.map((c) => {
      const [valorAnterior, valorNuevo] = auditValues(
        auditState.originalOrden,
        auditState.pendingForm,
        c,
      );
      return {
        usuario: auditState.pendingForm.responsable,
        fecha: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        campo: c,
        valorAnterior,
        valorNuevo,
        motivo,
      };
    });
    void commitEdit(
      auditState.originalOrden.id,
      auditState.pendingForm,
      entries,
      auditState.finalize,
    );
  };

  const handleEdit = (o: Orden) => {
    setEditingId(o.id);
    setErrors({});
    setFormKey((k) => k + 1);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleNewOrder = () => {
    setEditingId(null);
    setErrors({});
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (id: string) => {
    try {
      await api.deleteOrder(id);
      invoiceOrdersRef.current = invoiceOrdersRef.current.filter((order) => order.id !== id);
      onOrdenesChange((prev) => prev.filter((o) => o.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error("No se pudo eliminar la orden", error);
      window.alert(error instanceof Error ? error.message : "No se pudo eliminar la orden.");
    }
  };
  const deletedTarget = ordenes.find((o) => o.id === deleteId);

  return (
    <>
      {viewOrden && (
        <ViewOrderModal
          orden={viewOrden}
          onClose={() => setViewOrden(null)}
          onEdit={() => {
            const orden = viewOrden;
            setViewOrden(null);
            handleEdit(orden);
          }}
        />
      )}
      {deleteId && deletedTarget && (
        <ConfirmModal
          cliente={deletedTarget.cliente}
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
      {auditState && (
        <AuditModal
          changes={auditState.changes}
          onConfirm={handleAuditConfirm}
          onCancel={() => setAuditState(null)}
        />
      )}
      <MainLayout
        ordenes={ordenes}
        editingId={editingId}
        onNewOrder={handleNewOrder}
        title="Registro de Servicios"
        activeModule={activeModule}
        onSelectModule={onSelectModule}
        sidebarItems={sidebarItems}
        userName={userName}
        onLogout={onLogout}
      >
        <div ref={formRef}>
          <OrderForm
            key={formKey}
            editingId={editingId}
            saving={saving}
            ordenes={ordenes}
            responsables={responsables}
            initialForm={
              editingId ? ordenes.find((o) => o.id === editingId) : undefined
            }
            errors={errors}
            catalogo={catalogo}
            onSave={handleSave}
            onClear={handleNewOrder}
            onCancelEdit={handleNewOrder}
          />
        </div>
        <ServiceHistory
          ordenes={ordenes}
          responsables={responsables}
          tasks={tasks}
          invoiceConflicts={invoiceConflicts}
          onView={setViewOrden}
          onDeleteRequest={setDeleteId}
        />
      </MainLayout>
    </>
  );
}