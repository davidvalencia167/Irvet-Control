import { useRef, useState } from "react";
import StatsCards from "../../Components/StatsCards/StatsCards";
import MainLayout from "../../Layout/MainLayout";
import type { AuditEntry, FormOrden, Orden } from "../../types";
import OrderForm from "../../Components/OrderForm/OrderForm";
import { nextFactura, nextNumeroOrden } from "../../constants";
import { AuditModal, ConfirmModal, ViewOrderModal } from "../../Components/Modals/Modals";
import ServiceHistory from "../../Components/ServiceHistory/ServiceHistory";
import type { SidebarItem } from "../../Components/Slidebar/Slidebar";
import type { ServicioCatalogo } from "../../constants/services";

interface ServicesProps {
    activeModule?: string;
    onSelectModule?: (moduleKey: string) => void;
    sidebarItems?: SidebarItem[];
    catalogo: Record<string, ServicioCatalogo[]>;
}

const SENSITIVE: Array<keyof FormOrden> = ["tipoServicio", "movimiento"];

function detectChanges(original: Orden, updated: FormOrden): string[] {
  const changes: string[] = [];
  const labels: Partial<Record<keyof FormOrden, string>> = {
    tipoServicio: "Tipo de Servicio",
    movimiento:   "Movimiento (Ingreso/Gasto)",
  };

  for (const key of SENSITIVE) {
    if (original[key as keyof Orden] !== updated[key as keyof FormOrden]) {
      changes.push(labels[key] ?? key);
    }
  }

  const origTotal = original.pagos.reduce((a, p) => a + Number(p.valor || 0), 0);
  const newTotal  = updated.pagos.reduce((a, p) => a + Number(p.valor || 0), 0);
  if (origTotal !== newTotal) changes.push("Valores de pago");

  if (original.valorTotal !== updated.valorTotal) changes.push("Valor Total de la Orden");

  return changes;
}

export default function Services({ activeModule, onSelectModule, sidebarItems, catalogo }: ServicesProps) {

    const [ordenes, setOrdenes] = useState<Orden[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [viewOrden, setViewOrden] = useState<Orden | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [auditState, setAuditState] = useState<{
        changes: string[];
        pendingForm: FormOrden;
        originalOrden: Orden;
    }| null>(null);

    const formRef = useRef<HTMLDivElement>(null);
    const [formKey, setFormKey] = useState(0);

    const currentFactura = useRef(nextFactura());

      const validate = (form: FormOrden): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.cliente)              e.cliente              = "Requerido";
    if (!form.tipoServicio)         e.tipoServicio         = "Requerido";
    if (!form.descripcionServicio)  e.descripcionServicio  = "Requerido";
    if (form.mascotas.every((m) => !m.nombre)) e.mascotas = "Al menos una mascota debe tener nombre";
    if (!form.valorTotal || Number(form.valorTotal) <= 0) e.valorTotal = "Valor inválido";
    return e;
  };

    const handleSave = (form: FormOrden) => {
        const errs = validate(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }
        setErrors({});

        if (editingId) {
            const original = ordenes.find((o) => o.id === editingId)!;
            const changes = detectChanges(original, form);

            if (changes.length > 0) {
                setAuditState({changes, pendingForm: form, originalOrden: original})
                return;
            }
            commitEdit(editingId, form, []);
        } else {
            const validPets = form.mascotas.filter((pet) => pet.nombre.trim());
            const newOrders = validPets.map((pet) => {
                const factura = currentFactura.current;
                currentFactura.current = nextFactura();
                const pagos = form.pagos.filter((payment) => payment.mascotaId === pet.id || (!payment.mascotaId && pet.id === validPets[0].id));
                return {
                    ...form,
                    numeroOrden: pet.numeroOrden || nextNumeroOrden(),
                    mascotas: [pet],
                    pagos,
                    id: crypto.randomUUID(),
                    factura,
                    auditoria: [],
                };
            });
            setOrdenes((prev) => [...newOrders.reverse(), ...prev]);
            setFormKey((k) => k + 1);
            setEditingId(null);
        }
    };

    const commitEdit = (id: string, form: FormOrden, newAudit: AuditEntry[]) => {
        setOrdenes((prev) =>
            prev.map((o) =>
                o.id === id
                    ? { ...form, id, factura: o.factura, auditoria: [...o.auditoria, ...newAudit] }
                    : o
            )
        );
        setEditingId(null);
        setFormKey((k) => k + 1);
        setAuditState(null);
    };

    const handleAuditConfirm = (motivo: string) => {
        if (!auditState) return;
            const { originalOrden, pendingForm, changes } = auditState;

                const now = new Date();
                const newEntries: AuditEntry[] = changes.map((campo) => ({
                usuario: pendingForm.responsable,
                fecha:   now.toISOString().split("T")[0],
                hora:    now.toTimeString().slice(0, 5),
                campo,
                valorAnterior: String(originalOrden[campo as keyof Orden] ?? ""),
                valorNuevo:    String(pendingForm[campo as keyof FormOrden] ?? ""),
                motivo,
                }));

                commitEdit(originalOrden.id, pendingForm, newEntries);
    };


    const handleEdit = (o: Orden) => {
        setEditingId(o.id);
        setErrors({});
        setFormKey((k) => k + 1);
        formRef.current?.scrollIntoView({behavior: "smooth"});
    };

    const handleDelete = (id: string) => {
        setOrdenes((prev) => prev.filter((o)=> o.id !== id));
        setDeleteId(null);
    };


    const handleNewOrder = () => {
        setEditingId(null);
        setErrors({});
        setFormKey((k) => k + 1);
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const deletedTarget = ordenes.find((o) => o.id ===deleteId);


    return(
        <>
        {viewOrden && <ViewOrderModal orden={viewOrden} onClose={() => setViewOrden(null)}/>}


        {
            deleteId && deletedTarget && (
                <ConfirmModal cliente={deletedTarget.cliente} onConfirm={() => handleDelete(deleteId)} onCancel={() => setDeleteId(null)}/>
            )
        }
    
        {
            auditState && (
                <AuditModal changes={auditState.changes} onConfirm={handleAuditConfirm} onCancel={() => setAuditState(null)}/>
            )
        }

        <MainLayout
            ordenes={ordenes}
            editingId={editingId}
            onNewOrder={handleNewOrder}
            title="Registro de Servicios"
            activeModule={activeModule}
            onSelectModule={onSelectModule}
            sidebarItems={sidebarItems}
        >
            <StatsCards ordenes={ordenes}/>
            <div ref={formRef}>
                <OrderForm key={formKey} factura={currentFactura.current} editingId={editingId} errors={errors} catalogo={catalogo} onSave={handleSave} onClear={handleNewOrder} onCancelEdit={handleNewOrder}/>
            </div>

            <ServiceHistory ordenes={ordenes} onView={setViewOrden} onEdit={handleEdit} onDeleteRequest={setDeleteId}/>
        </MainLayout>
        </>
        
    );
}