import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Cliente, Orden } from "../../types";
import type {
  DispatchCreateInput,
  DispatchPriority,
  DispatchRequest,
  DispatchServiceType,
} from "../../types/dispatch";

const SERVICE_TYPES: DispatchServiceType[] = [
  "Recolección de muestra",
  "Traslado a laboratorio",
  "Entrega de resultados",
  "Entrega de materiales",
  "Recolección pendiente",
  "Otro",
];

const FIELD =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1B2B4B] outline-none focus:border-[#2BB5C3] focus:ring-2 focus:ring-[#2BB5C3]/15";

interface FormValue {
  orderId: string;
  clientId: string;
  clientName: string;
  contactName: string;
  contactPhone: string;
  serviceType: DispatchServiceType;
  description: string;
  originAddress: string;
  destinationAddress: string;
  priority: DispatchPriority;
  latitude: string;
  longitude: string;
}

function formFromDispatch(dispatch?: DispatchRequest): FormValue {
  if (!dispatch) return blankForm();
  return {
    orderId: dispatch.orderId ?? "",
    clientId: dispatch.clientId ?? "",
    clientName: dispatch.clientName,
    contactName: dispatch.contactName,
    contactPhone: dispatch.contactPhone,
    serviceType: dispatch.serviceType,
    description: dispatch.description,
    originAddress: dispatch.origin.address,
    destinationAddress: dispatch.destination.address,
    priority: dispatch.priority,
    latitude: dispatch.origin.coordinate?.latitude.toString() ?? "",
    longitude: dispatch.origin.coordinate?.longitude.toString() ?? "",
  };
}

interface Props {
  clients: Cliente[];
  orders: Orden[];
  initial?: DispatchRequest;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: DispatchCreateInput, id?: string) => Promise<void>;
}

function blankForm(): FormValue {
  return {
    orderId: "",
    clientId: "",
    clientName: "",
    contactName: "",
    contactPhone: "",
    serviceType: "Recolección de muestra",
    description: "",
    originAddress: "",
    destinationAddress: "",
    priority: "Normal",
    latitude: "",
    longitude: "",
  };
}

export default function DispatchRequestForm({
  clients,
  orders,
  initial,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<FormValue>(() => formFromDispatch(initial));
  const [error, setError] = useState("");

  const update = (key: keyof FormValue, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const fillClient = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    setForm((current) => ({
      ...current,
      clientId,
      clientName: client?.nombre ?? "",
      contactName: client?.representanteLegal ?? "",
      contactPhone: client?.telefono ?? "",
      originAddress: client?.direccion ?? "",
    }));
  };

  const selectOrder = (orderId: string) => {
    const order = orders.find((item) => item.id === orderId);
    const client = clients.find(
      (item) => item.nombre.trim().toLocaleLowerCase() === order?.cliente.trim().toLocaleLowerCase(),
    );
    setForm((current) => ({
      ...current,
      orderId,
      ...(client
        ? {
            clientId: client.id,
            clientName: client.nombre,
            contactName: client.representanteLegal,
            contactPhone: client.telefono,
            originAddress: client.direccion,
          }
        : { clientId: "", clientName: order?.cliente ?? current.clientName }),
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const latitude = form.latitude.trim() ? Number(form.latitude) : null;
    const longitude = form.longitude.trim() ? Number(form.longitude) : null;
    if ((latitude === null) !== (longitude === null)) {
      setError("Indique latitud y longitud juntas, o deje ambas vacías.");
      return;
    }
    if (
      latitude !== null &&
      longitude !== null &&
      (!Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180)
    ) {
      setError("Las coordenadas no son válidas.");
      return;
    }
    if (!form.clientName.trim() || !form.originAddress.trim() || !form.destinationAddress.trim()) {
      setError("Complete el cliente y las direcciones de origen y destino.");
      return;
    }

    await onSubmit(
      {
        orderId: form.orderId || null,
        clientId: form.clientId || null,
        clientName: form.clientName.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        serviceType: form.serviceType,
        description: form.description.trim(),
        origin: {
          address: form.originAddress.trim(),
          coordinate:
            latitude === null || longitude === null
              ? null
              : { latitude, longitude },
        },
        destination: { address: form.destinationAddress.trim() },
        priority: form.priority,
      },
      initial?.id,
    );
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-form-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between bg-[#1B2B4B] px-5 py-4 text-white">
          <div>
            <h2 id="dispatch-form-title" className="text-base font-extrabold">
              {initial ? "Editar solicitud" : "Nueva solicitud de despacho"}
            </h2>
            <p className="mt-0.5 text-xs text-white/65">
              Los datos de clínica y contacto se toman del registro existente.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar formulario"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </header>
        <form onSubmit={submit} className="space-y-5 p-5">
          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Orden relacionada
              <select
                value={form.orderId}
                onChange={(event) => selectOrder(event.target.value)}
                className={FIELD}
              >
                <option value="">Sin orden asociada</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.numeroOrden || order.factura} · {order.cliente} · {order.fecha}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Clínica existente
              <select
                value={form.clientId}
                onChange={(event) => fillClient(event.target.value)}
                className={FIELD}
              >
                <option value="">Seleccionar clínica</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nombre}
                  </option>
                ))}
              </select>
              {!form.clientId && (
                <input
                  required
                  value={form.clientName}
                  onChange={(event) => update("clientName", event.target.value)}
                  placeholder="Nombre de la clínica"
                  className={FIELD}
                />
              )}
            </label>
            <label className="text-xs font-bold text-slate-600">
              Tipo de servicio
              <select
                value={form.serviceType}
                onChange={(event) =>
                  update("serviceType", event.target.value as DispatchServiceType)
                }
                className={FIELD}
              >
                {SERVICE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-600">
              Contacto
              <input
                value={form.contactName}
                onChange={(event) => update("contactName", event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Teléfono
              <input
                value={form.contactPhone}
                onChange={(event) => update("contactPhone", event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Descripción
              <input
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className={FIELD}
                placeholder="Indicaciones del servicio"
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Dirección de origen
              <input
                required
                value={form.originAddress}
                onChange={(event) => update("originAddress", event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Dirección de destino
              <input
                required
                value={form.destinationAddress}
                onChange={(event) => update("destinationAddress", event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="text-xs font-bold text-slate-600">
              Prioridad
              <select
                value={form.priority}
                onChange={(event) => update("priority", event.target.value)}
                className={FIELD}
              >
                <option>Normal</option>
                <option>Prioritaria</option>
                <option>Urgente</option>
              </select>
            </label>
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="text-xs font-bold text-slate-600">
                Coordenadas del origen (opcionales)
              </legend>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(event) => update("latitude", event.target.value)}
                placeholder="Latitud"
                aria-label="Latitud del origen"
                className={FIELD}
              />
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(event) => update("longitude", event.target.value)}
                placeholder="Longitud"
                aria-label="Longitud del origen"
                className={FIELD}
              />
            </fieldset>
          </div>
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-4 sm:flex-row">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#2BB5C3] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Guardando..." : initial ? "Guardar cambios" : "Crear solicitud"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
