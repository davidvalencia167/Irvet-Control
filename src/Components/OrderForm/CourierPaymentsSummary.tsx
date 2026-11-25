import { useMemo, useState } from "react";
import { CalendarDays, Wallet } from "lucide-react";
import { currentDate } from "../../constants";
import type { Orden } from "../../types";
import { calculatePaymentSummary } from "../../utils/payment";

const MORNING_CUTOFF = "12:00";

const formatMoney = (value: number) => `$${value.toLocaleString("es-CO")}`;

function isMorning(order: Orden) {
  return Boolean(order.horaSolicitud) && order.horaSolicitud < MORNING_CUTOFF;
}

export default function CourierPaymentsSummary({ ordenes }: { ordenes: Orden[] }) {
  const [dateFilter, setDateFilter] = useState(currentDate());
  const [courierFilter, setCourierFilter] = useState("");

  const couriers = useMemo(
    () => [...new Set(ordenes.map((order) => order.domiciliario.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [ordenes],
  );

  const filteredOrders = useMemo(
    () => ordenes
      .filter((order) => !dateFilter || order.fecha === dateFilter)
      .filter((order) => !courierFilter || order.domiciliario === courierFilter)
      .slice()
      .sort((a, b) => (a.horaSolicitud || "").localeCompare(b.horaSolicitud || "")),
    [ordenes, dateFilter, courierFilter],
  );

  const groups = useMemo(() => {
    const grouped = new Map<string, Orden[]>();
    filteredOrders.forEach((order) => {
      const courier = order.domiciliario.trim() || "Sin domiciliario asignado";
      grouped.set(courier, [...(grouped.get(courier) ?? []), order]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredOrders]);

  const overall = filteredOrders.reduce(
    (totals, order) => {
      const summary = calculatePaymentSummary(order.valorTotal, order.pagos ?? []);
      totals.received += summary.received;
      totals.pending += summary.pending;
      totals.discounts += summary.discounts;
      return totals;
    },
    { received: 0, pending: 0, discounts: 0 },
  );

  const renderPeriod = (orders: Orden[], title: string) => (
    <div className="min-w-0">
      <h3 className="border-b border-slate-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7A99]">
        {title} <span className="ml-1 font-semibold">({orders.length})</span>
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-[#F8FAFC]">
            <tr>
              <th className="w-[12%] px-2 py-1.5 text-left text-[9px] font-bold uppercase text-[#6B7A99]">Hora</th>
              <th className="w-[34%] px-2 py-1.5 text-left text-[9px] font-bold uppercase text-[#6B7A99]">Veterinaria</th>
              <th className="w-[18%] px-2 py-1.5 text-right text-[9px] font-bold uppercase text-[#6B7A99]">Recibido</th>
              <th className="w-[12%] px-2 py-1.5 text-right text-[9px] font-bold uppercase text-[#6B7A99]">Promoción</th>
              <th className="w-[12%] px-2 py-1.5 text-right text-[9px] font-bold uppercase text-[#6B7A99]">Descuento</th>
              <th className="w-[12%] px-2 py-1.5 text-right text-[9px] font-bold uppercase text-[#6B7A99]">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const summary = calculatePaymentSummary(order.valorTotal, order.pagos ?? []);
              const methods = Object.keys(summary.byMethod).join(", ");
              return (
                <tr key={order.id} className="border-t border-slate-100 text-[11px] hover:bg-[#F8FAFC]">
                  <td className="whitespace-nowrap px-2 py-1.5 font-semibold text-[#1B2B4B]">{order.horaSolicitud || "—"}</td>
                  <td className="truncate px-2 py-1.5 text-[#1B2B4B]" title={order.cliente}>{order.cliente || "—"}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-emerald-700" title={methods || "Sin método registrado"}>
                    {formatMoney(summary.received)}
                    {methods && <span className="block truncate text-[9px] font-normal text-[#6B7A99]">{methods}</span>}
                  </td>
                  <td className="px-2 py-1.5 text-right text-blue-700">{formatMoney(summary.promotions)}</td>
                  <td className="px-2 py-1.5 text-right text-violet-700">{formatMoney(summary.discounts)}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-amber-700">{formatMoney(summary.pending)}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-2 py-4 text-center text-[10px] text-[#6B7A99]">Sin servicios en este horario.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-extrabold tracking-tight text-[#1B2B4B]">Consolidado de pagos por domiciliario</h2>
          <p className="mt-0.5 text-[12px] text-[#6B7A99]">Recaudo, promociones, descuentos y saldos del turno.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
            <CalendarDays size={13} className="text-[#6B7A99]" />
            <span className="sr-only">Filtrar por fecha</span>
            <input aria-label="Filtrar por fecha" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-32 text-[11px] text-[#1B2B4B] outline-none" />
            <button type="button" onClick={() => setDateFilter("")} className="text-[10px] font-semibold text-[#2BB5C3]">Todas</button>
          </div>
          <label>
            <span className="sr-only">Filtrar por domiciliario</span>
            <select value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-[#1B2B4B]">
              <option value="">Todos los domiciliarios</option>
              {couriers.map((courier) => <option key={courier} value={courier}>{courier}</option>)}
            </select>
          </label>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2">
        {[
          ["Recibido", overall.received, "text-emerald-700"],
          ["Descuentos", overall.discounts, "text-violet-700"],
          ["Pendiente", overall.pending, "text-amber-700"],
        ].map(([label, amount, tone]) => (
          <div key={label as string} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
            <Wallet size={14} className={tone as string} />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase text-[#6B7A99]">{label as string}</p>
              <p className={`truncate text-[13px] font-extrabold ${tone as string}`}>{formatMoney(amount as number)}</p>
            </div>
          </div>
        ))}
      </section>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-[12px] text-[#6B7A99]">
          No hay servicios para la fecha seleccionada.
        </div>
      ) : groups.map(([courier, orders]) => {
        const courierSummary = orders.reduce(
          (totals, order) => {
            const summary = calculatePaymentSummary(order.valorTotal, order.pagos ?? []);
            totals.received += summary.received;
            totals.pending += summary.pending;
            return totals;
          },
          { received: 0, pending: 0 },
        );
        const morning = orders.filter(isMorning);
        const afternoon = orders.filter((order) => !isMorning(order));
        return (
          <section key={courier} className="overflow-hidden rounded-xl border border-[#2BB5C3]/20 bg-white shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#F8FAFC] px-3 py-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-extrabold text-[#1B2B4B]">{courier}</h2>
                <span className="text-[10px] text-[#6B7A99]">{orders.length} servicios</span>
              </div>
              <p className="text-[10px] font-semibold text-[#6B7A99]">
                Recibido <b className="text-emerald-700">{formatMoney(courierSummary.received)}</b>
                <span className="mx-2">·</span>
                Pendiente <b className="text-amber-700">{formatMoney(courierSummary.pending)}</b>
              </p>
            </header>
            <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {renderPeriod(morning, "Mañana")}
              {renderPeriod(afternoon, "Tarde")}
            </div>
          </section>
        );
      })}
    </div>
  );
}
