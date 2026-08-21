import {
  DollarSign, TrendingDown, ClipboardList,
  Truck, Calculator, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { Orden } from "../../types";

interface StatsCardsProps {
  ordenes: Orden[];
}

export default function StatsCards({ ordenes }: StatsCardsProps) {
  const ingresos = ordenes
    .filter((o) => o.movimiento === "Ingreso")
    .reduce((a, o) => a + Number(o.valorTotal || 0), 0);

  const gastos = ordenes
    .filter((o) => o.movimiento === "Gasto")
    .reduce((a, o) => a + Number(o.valorTotal || 0), 0);

  // Las muestras coaguladas cuentan como domicilio pero no como examen
  const domicilios = ordenes.filter((o) => o.domiciliario).length;

  // Solo ordenes que no son coaguladas para el conteo de servicios
  const serviciosValidos = ordenes.filter(
    (o) => !o.mascotas.every((m) => m.estadoMuestra === "Coagulada")
  ).length;

  const promedio = ordenes.length
    ? Math.round((ingresos + gastos) / ordenes.length)
    : 0;

  const stats = [
    {
      label: "Total Ingresos",
      value: `$${ingresos.toLocaleString("es-CO")}`,
      icon: DollarSign,
      iconBg: "bg-[#2BB5C3]",
      badge: "bg-teal-50 text-teal-700",
      up: true,
    },
    {
      label: "Total Gastos",
      value: `$${gastos.toLocaleString("es-CO")}`,
      icon: TrendingDown,
      iconBg: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700",
      up: false,
    },
    {
      label: "Servicios Registrados",
      value: String(serviciosValidos),
      icon: ClipboardList,
      iconBg: "bg-indigo-500",
      badge: "bg-indigo-50 text-indigo-700",
      up: true,
    },
    {
      label: "Domicilios Realizados",
      value: String(domicilios),
      icon: Truck,
      iconBg: "bg-violet-500",
      badge: "bg-violet-50 text-violet-700",
      up: true,
    },
    {
      label: "Valor Promedio",
      value: `$${promedio.toLocaleString("es-CO")}`,
      icon: Calculator,
      iconBg: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700",
      up: true,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 border border-[rgba(27,43,75,0.06)]"
          style={{ boxShadow: "0 1px 6px rgba(27,43,75,0.06)" }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center`}>
              <s.icon size={16} className="text-white" strokeWidth={2} />
            </div>
            <span className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-lg ${s.badge}`}>
              {s.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            </span>
          </div>
          <p className="text-[20px] font-extrabold text-[#1B2B4B] leading-tight tracking-tight">
            {s.value}
          </p>
          <p className="text-[11px] text-[#6B7A99] mt-1 font-medium">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
