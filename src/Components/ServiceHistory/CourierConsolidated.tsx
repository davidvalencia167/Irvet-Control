import type { Orden } from "../../types";
import { summarizeByCourier } from "../../utils/payment";

export default function CourierConsolidated({ ordenes }: { ordenes: Orden[] }) {
  const courierSummary = summarizeByCourier(ordenes);
  if (courierSummary.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#2BB5C3]/20 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-extrabold text-[#1B2B4B]">Consolidado de recaudo por domiciliario</h2>
          <p className="text-[11px] text-[#6B7A99]">Acumulado de las órdenes filtradas; cada pago se cuenta una sola vez.</p>
        </div>
        <span className="text-[11px] font-bold text-[#6B7A99]">{courierSummary.length} domiciliarios</span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {courierSummary.map((item) => (
          <div key={item.domiciliario} className="rounded-xl bg-[#F8FAFC] p-3">
            <p className="text-[12px] font-extrabold text-[#1B2B4B]">{item.domiciliario}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
              <span className="text-[#6B7A99]">Servicios <b className="block text-[#1B2B4B]">${item.services.toLocaleString("es-CO")}</b></span>
              <span className="text-[#6B7A99]">Recaudado <b className="block text-emerald-700">${item.received.toLocaleString("es-CO")}</b></span>
              <span className="text-[#6B7A99]">Gastos <b className="block text-rose-600">${item.expenses.toLocaleString("es-CO")}</b></span>
              <span className="text-[#6B7A99]">Neto <b className="block text-[#1B2B4B]">${item.net.toLocaleString("es-CO")}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
