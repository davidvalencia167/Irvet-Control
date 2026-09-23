import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import StatsCards from "../../Components/StatsCards/StatsCards";
import MainLayout from "../../Layout/MainLayout";
import type { AuditEntry, FormOrden, Orden } from "../../types";
import OrderForm from "../../Components/OrderForm/OrderForm";
import { nextFactura } from "../../constants";
import {
  AuditModal,
  ConfirmModal,
  ViewOrderModal,
} from "../../Components/Modals/Modals";
import ServiceHistory from "../../Components/ServiceHistory/ServiceHistory";
import type { SidebarItem } from "../../Components/Slidebar/Slidebar";
import type { ServicioCatalogo } from "../../constants/services";

interface ServicesProps {
  activeModule?: string;
  onSelectModule?: (moduleKey: string) => void;
  sidebarItems?: SidebarItem[];
  catalogo: Record<string, ServicioCatalogo[]>;
  ordenes: Orden[];
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
  return form.pagos.reduce(
    (sum, payment) => sum + Number(payment.valor || 0),
    0,
  );
}

export default function Services({
  activeModule,
  onSelectModule,
  sidebarItems,
  catalogo,
  ordenes,
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
  const currentFactura = useRef(nextFactura());

  const validate = (form: FormOrden, finalize = false) => {
    const e: Record<string, string> = {};
    if (!form.cliente) e.cliente = "Requerido";
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

  const commitEdit = (
    id: string,
    form: FormOrden,
    audit: AuditEntry[],
    finalize: boolean,
  ) => {
    onOrdenesChange((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...form,
              id,
              factura: o.factura,
              estadoOrden: finalize
                ? "Completada"
                : o.estadoOrden === "Pendiente de recepción"
                  ? "En proceso"
                  : o.estadoOrden,
              auditoria: [...o.auditoria, ...audit],
            }
          : o,
      ),
    );
    setEditingId(null);
    setFormKey((k) => k + 1);
    setAuditState(null);
  };

  const handleSave = (form: FormOrden, finalize = false) => {
    const errs = validate(form, finalize);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (editingId) {
      const original = ordenes.find((o) => o.id === editingId);
      if (!original) return;
      const changes = detectChanges(original, form);
      if (changes.length) {
        setAuditState({
          changes,
          pendingForm: form,
          originalOrden: original,
          finalize,
        });
        return;
      }
      commitEdit(editingId, form, [], finalize);
      return;
    }
    const invoice = currentFactura.current;
    currentFactura.current = nextFactura();
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
    onOrdenesChange((prev) => [newOrder, ...prev]);
    setFormKey((k) => k + 1);
    setEditingId(null);
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
    commitEdit(
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
  const handleDelete = (id: string) => {
    onOrdenesChange((prev) => prev.filter((o) => o.id !== id));
    setDeleteId(null);
  };
  const deletedTarget = ordenes.find((o) => o.id === deleteId);

  return (
    <>
      {viewOrden && (
        <ViewOrderModal orden={viewOrden} onClose={() => setViewOrden(null)} />
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
      >
        <StatsCards ordenes={ordenes} />
        <div ref={formRef}>
          <OrderForm
            key={formKey}
            factura={
              editingId
                ? (ordenes.find((o) => o.id === editingId)?.factura ??
                  currentFactura.current)
                : currentFactura.current
            }
            editingId={editingId}
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
          onView={setViewOrden}
          onEdit={handleEdit}
          onDeleteRequest={setDeleteId}
        />
      </MainLayout>
    </>
  );
}