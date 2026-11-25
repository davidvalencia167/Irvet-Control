import { useMemo, useState } from "react";
import { ExternalLink, Filter, Search, Trash2 } from "lucide-react";
import type { Orden, Responsable } from "../../types";
import type { DailyTask } from "../../types/tasks";
import type { ConflictoFacturas } from "../../utils/facturas";
import { formatResponsableName, formatResponsableNames } from "../../utils/responsables";

export const MORNING_COLUMN_SIDE: "left" | "right" = "left";
export const MORNING_CUTOFF = "12:00";

interface ServiceHistoryProps {
  ordenes: Orden[];
  responsables: Responsable[];
  tasks: DailyTask[];
  invoiceConflicts: ConflictoFacturas[];
  onView: (orden: Orden) => void;
  onOpenPets: (orden: Orden) => void;
  onDeleteRequest: (id: string) => void;
}

interface ServiceColumnProps {
  title: string;
  ordenes: Orden[];
  responsables: Responsable[];
  onView: (orden: Orden) => void;
  onOpenPets: (orden: Orden) => void;
  onDeleteRequest: (id: string) => void;
}

function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function matchesFilter(orden: Orden, filter: string, today: string): boolean {
  if (filter === "hoy") return orden.fecha === today;
  if (filter === "semana" || filter === "mes") {
    const date = new Date(`${orden.fecha}T00:00:00`);
    const now = new Date(`${today}T00:00:00`);
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
    return days >= 0 && days < (filter === "semana" ? 7 : 31);
  }
  if (filter === "prioritaria") {
    return orden.prioridad === "Prioritaria" || orden.prioridad === "Urgente";
  }
  if (filter === "pagado") return orden.estadoPago === "Pagado";
  if (filter === "pendiente") return orden.estadoPago !== "Pagado";
  if (filter === "recepcion") return orden.estadoOrden === "Pendiente de recepción";
  return true;
}

function ServiceColumn({
  title,
  ordenes,
  responsables,
  onView,
  onOpenPets,
  onDeleteRequest,
}: ServiceColumnProps) {
  const names = useMemo(() => formatResponsableNames(responsables), [responsables]);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[rgba(27,43,75,0.08)] bg-white">
      <h3 className="border-b border-[rgba(27,43,75,0.06)] bg-[#F8FAFC] px-3 py-2 text-[12px] font-extrabold uppercase tracking-wide text-[#1B2B4B]">
        {title}
        <span className="ml-2 font-semibold text-[#6B7A99]">({ordenes.length})</span>
      </h3>
      <div className="h-[calc(100vh-31rem)] min-h-48 overflow-y-auto overscroll-contain">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-white shadow-sm">
            <tr>
              <th className="w-[15%] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#6B7A99]">Hora</th>
              <th className="w-[32%] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#6B7A99]">Veterinaria</th>
              <th className="w-[20%] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#6B7A99]">Responsable</th>
              <th className="w-[20%] px-2 py-1.5 text-left text-[10px] font-bold uppercase text-[#6B7A99]">Domiciliario</th>
              <th className="w-[13%] px-1 py-1.5 text-center text-[10px] font-bold uppercase text-[#6B7A99]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id} className="border-t border-slate-100 text-sm hover:bg-[#F8FAFC]">
                <td className="whitespace-nowrap px-2 py-1 text-[12px] font-semibold text-[#1B2B4B]">{orden.horaSolicitud || "—"}</td>
                <td className="truncate px-2 py-1 text-[12px] text-[#1B2B4B]" title={orden.cliente}>
                  {orden.cliente ? (
                    <button
                      type="button"
                      onClick={() => onOpenPets(orden)}
                      aria-label={`Abrir solicitud de ${orden.cliente} en Mascotas`}
                      title="Abrir solicitud en Mascotas"
                      className="block w-full truncate text-left hover:text-[#2BB5C3] hover:underline focus-visible:outline focus-visible:outline-[#2BB5C3]"
                    >
                      {orden.cliente}
                    </button>
                  ) : "—"}
                </td>
                <td className="truncate px-2 py-1 text-[12px] text-[#6B7A99]" title={orden.responsable}>
                  {formatResponsableName(orden.responsable, responsables, names) || "—"}
                </td>
                <td className="truncate px-2 py-1 text-[12px] text-[#6B7A99]" title={orden.domiciliario}>{orden.domiciliario || "—"}</td>
                <td className="px-1 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onView(orden)}
                      aria-label={`Abrir detalle de ${orden.cliente || "la orden"}`}
                      title="Abrir detalle"
                      className="rounded-md p-1 text-blue-700 hover:bg-blue-50 focus-visible:outline focus-visible:outline-[#2BB5C3]"
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRequest(orden.id)}
                      aria-label={`Eliminar servicio de ${orden.cliente || "la orden"}`}
                      title="Eliminar"
                      className="rounded-md p-1 text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-[#2BB5C3]"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[12px] text-[#6B7A99]">
                  Sin servicios para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ServiceHistory({
  ordenes,
  responsables,
  tasks,
  invoiceConflicts,
  onView,
  onOpenPets,
  onDeleteRequest,
}: ServiceHistoryProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [courierFilter, setCourierFilter] = useState("");
  const today = localDate();
  const filtered = ordenes.filter((orden) => {
    const query = search.trim().toLocaleLowerCase();
    const searchText = [
      orden.numeroOrden,
      ...(orden.mascotas ?? []).map((mascota) => mascota.numeroOrden),
      orden.factura,
      orden.cliente,
      orden.responsable,
      orden.domiciliario,
      orden.fecha,
      orden.tipoServicio,
    ].join(" ").toLocaleLowerCase();
    const matchesCourier = !courierFilter || (
      courierFilter === "__sin_asignar__"
        ? !orden.domiciliario
        : orden.domiciliario === courierFilter
    );
    return (!query || searchText.includes(query)) &&
      matchesCourier &&
      matchesFilter(orden, filter, today);
  });

  const morning = filtered.filter((orden) => orden.horaSolicitud && orden.horaSolicitud < MORNING_CUTOFF);
  const afternoon = filtered.filter((orden) => !orden.horaSolicitud || orden.horaSolicitud >= MORNING_CUTOFF);
  const leftOrders = MORNING_COLUMN_SIDE === "left" ? morning : afternoon;
  const rightOrders = MORNING_COLUMN_SIDE === "right" ? morning : afternoon;
  const taskExpenses = tasks.filter(
    (task) => task.movement === "Gasto" && Number(task.amount) > 0,
  );

  return (
    <section className="space-y-3">
      {invoiceConflicts.length > 0 && (
        <aside role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <p className="font-bold">Hay facturas diferentes para una misma veterinaria y fecha.</p>
          <p className="mt-1">No se han modificado los registros automáticamente; revisa estos grupos antes de una migración:</p>
          <ul className="mt-1 list-inside list-disc">
            {invoiceConflicts.map((conflict) => (
              <li key={`${conflict.veterinaria}-${conflict.fecha}`}>
                {conflict.veterinaria} · {conflict.fecha}: {conflict.facturas.join(", ")}
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(27,43,75,0.06)] bg-white p-2.5">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">Buscar servicios</span>
          <Search size={14} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar veterinaria, N° de orden, hora, responsable..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-[#F4F7FA] pl-8 pr-3 text-xs text-[#1B2B4B] focus-visible:outline focus-visible:outline-[#2BB5C3]"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <Filter size={13} aria-hidden="true" className="text-[#6B7A99]" />
          <span className="sr-only">Filtrar por periodo y estado</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-[#F4F7FA] px-2 text-xs text-[#1B2B4B] focus-visible:outline focus-visible:outline-[#2BB5C3]"
          >
            <option value="todos">Todos</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
            <option value="prioritaria">Prioritaria / Urgente</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente pago</option>
            <option value="recepcion">Pendiente recepción</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por domiciliario</span>
          <select
            value={courierFilter}
            onChange={(event) => setCourierFilter(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-[#F4F7FA] px-2 text-xs text-[#1B2B4B] focus-visible:outline focus-visible:outline-[#2BB5C3]"
          >
            <option value="">Todos los domiciliarios</option>
            {[...new Set(ordenes.map((orden) => orden.domiciliario).filter(Boolean))].map((courier) => (
              <option key={courier} value={courier}>{courier}</option>
            ))}
            <option value="__sin_asignar__">Sin domiciliario</option>
          </select>
        </label>
        <span className="ml-auto text-[11px] font-semibold text-[#6B7A99]">{filtered.length} registros</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ServiceColumn
          title={MORNING_COLUMN_SIDE === "left" ? "Mañana" : "Tarde"}
          ordenes={leftOrders}
          responsables={responsables}
          onView={onView}
          onOpenPets={onOpenPets}
          onDeleteRequest={onDeleteRequest}
        />
        <ServiceColumn
          title={MORNING_COLUMN_SIDE === "right" ? "Mañana" : "Tarde"}
          ordenes={rightOrders}
          responsables={responsables}
          onView={onView}
          onOpenPets={onOpenPets}
          onDeleteRequest={onDeleteRequest}
        />
      </div>
      {taskExpenses.length > 0 && (
        <details className="overflow-hidden rounded-xl border border-rose-100 bg-white">
          <summary className="cursor-pointer bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-800 focus-visible:outline focus-visible:outline-[#2BB5C3]">
            Gastos de tareas diarias ({taskExpenses.length})
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  {["Fecha", "Tarea", "Responsable", "Estado", "Valor"].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[#6B7A99]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskExpenses.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-[11px] text-[#6B7A99]">{task.completedDate || task.dueDate || "—"}</td>
                    <td className="px-3 py-2 text-[11px] font-semibold text-[#1B2B4B]">{task.description}</td>
                    <td className="px-3 py-2 text-[11px] text-[#6B7A99]">{task.responsible || "Sin asignar"}</td>
                    <td className="px-3 py-2 text-[11px] text-[#6B7A99]">{task.status}</td>
                    <td className="px-3 py-2 text-[12px] font-extrabold text-rose-600">- ${Number(task.amount).toLocaleString("es-CO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
