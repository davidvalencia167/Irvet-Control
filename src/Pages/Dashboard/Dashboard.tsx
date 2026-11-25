import { useMemo, useState, type ReactNode } from "react";
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    DollarSign,
    Filter,
    RefreshCw,
    Stethoscope,
    Truck,
    Users,
    Wallet,
} from "lucide-react";
import type { ComboCatalogo, ServicioCatalogo } from "../../constants/services";
import type { Cliente, Medico, Orden, Responsable, ServicioOrden } from "../../types";
import type { DailyTask } from "../../types/tasks";
import { calculatePaymentSummary } from "../../utils/payment";

interface DashboardAdminProps {
    ordenes: Orden[];
    clientes: Cliente[];
    medicos: Medico[];
    responsables: Responsable[];
    catalogo: Record<string, ServicioCatalogo[]>;
    combos: ComboCatalogo[];
    tasks: DailyTask[];
}

type Tab = "general" | "analitico";
type Filters = {
    desde: string;
    hasta: string;
    tipoServicio: string;
    responsable: string;
    establecimiento: string;
    examen: string;
    medioPago: string;
};
type Aggregate = { label: string; amount: number; count: number };
type ServiceRecord = { service: ServicioOrden; key: string };
type Metrics = {
    incomeOrders: Orden[];
    expenseOrders: Orden[];
    income: number;
    collected: number;
    pending: number;
    orderExpenses: number;
    taskExpenses: number;
    expenses: number;
    uniqueClients: number;
    serviceCount: number;
    net: number;
    incomplete: number;
};
type Analysis = {
    establishment: Array<Aggregate & { collected: number; services: number }>;
    responsible: Aggregate[];
    couriers: Array<Aggregate & { count: number }>;
    exams: Array<{ label: string; count: number; revenue: number }>;
    payments: Array<{ label: string; amount: number; count: number }>;
    serviceRevenue: Array<{ label: string; revenue: number }>;
};

const EMPTY = "Sin información";
const initialFilters: Filters = {
    desde: "",
    hasta: "",
    tipoServicio: "",
    responsable: "",
    establecimiento: "",
    examen: "",
    medioPago: "",
};

const money = (value: number) =>
    new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);

const number = (value: number) => new Intl.NumberFormat("es-CO").format(value);
const clean = (value: string | undefined) => value?.trim() || EMPTY;
const amount = (value: string | number | undefined) => Number(value || 0);

function paymentTotal(order: Orden, onlyEffective = false) {
    const summary = calculatePaymentSummary(order.valorTotal, order.pagos ?? []);
    return onlyEffective ? summary.received : summary.covered;
}

function servicesOf(order: Orden): ServiceRecord[] {
    const records: ServiceRecord[] = [];
    (order.mascotas ?? []).forEach((pet) => {
        const seen = new Set<string>();
        (pet.servicios ?? []).forEach((service) => {
            const key = `${pet.id}:${service.id || service.descripcion.trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                records.push({ service, key });
            }
        });
    });
    return records;
}

function aggregate(
    orders: Orden[],
    getLabel: (order: Orden) => string,
    getAmount: (order: Orden) => number,
): Aggregate[] {
    const values = new Map<string, Aggregate>();
    orders.forEach((order) => {
        const label = clean(getLabel(order));
        const current = values.get(label) ?? { label, amount: 0, count: 0 };
        current.amount += getAmount(order);
        current.count += 1;
        values.set(label, current);
    });
    return [...values.values()].sort((a, b) => b.amount - a.amount || b.count - a.count || a.label.localeCompare(b.label, "es"));
}

export default function DashboardAdmin({
    ordenes,
    clientes,
    medicos,
    responsables,
    tasks,
}: DashboardAdminProps) {
    const [tab, setTab] = useState<Tab>("general");
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [refresh, setRefresh] = useState(0);

    const options = useMemo(() => ({
        tipos: [...new Set(ordenes.map((order) => order.tipoServicio).filter(Boolean))].sort(),
        responsables: [...new Set(ordenes.map((order) => order.responsable).filter(Boolean))].sort(),
        establecimientos: [...new Set(ordenes.map((order) => order.cliente).filter(Boolean))].sort(),
        examenes: [...new Set(ordenes.flatMap((order) => servicesOf(order).map(({ service }) => service.descripcion).filter(Boolean)))].sort(),
        medios: [...new Set(ordenes.flatMap((order) => (order.pagos ?? []).map((payment) => payment.medio).filter(Boolean)))].sort(),
    }), [ordenes]);

    const filteredOrders = useMemo(() => {
        void refresh;
        return ordenes.filter((order) => {
            const orderDate = order.fecha || "";
            const hasPayment = !filters.medioPago || (order.pagos ?? []).some((payment) => clean(payment.medio) === filters.medioPago);
            const hasExam = !filters.examen || servicesOf(order).some(({ service }) => service.descripcion === filters.examen);
            return (!filters.desde || orderDate >= filters.desde)
                && (!filters.hasta || orderDate <= filters.hasta)
                && (!filters.tipoServicio || order.tipoServicio === filters.tipoServicio)
                && (!filters.responsable || clean(order.responsable) === filters.responsable)
                && (!filters.establecimiento || clean(order.cliente) === filters.establecimiento)
                && hasPayment
                && hasExam;
        });
    }, [filters, ordenes, refresh]);

    const metrics = useMemo(() => {
        const incomeOrders = filteredOrders.filter((order) => order.movimiento === "Ingreso");
        const expenseOrders = filteredOrders.filter((order) => order.movimiento === "Gasto");
        const income = incomeOrders.reduce((sum, order) => sum + amount(order.valorTotal), 0);
        const collected = incomeOrders.reduce((sum, order) => sum + paymentTotal(order, true), 0);
        const pending = incomeOrders.reduce((sum, order) => Math.max(0, sum + amount(order.valorTotal) - paymentTotal(order)), 0);
        const orderExpenses = expenseOrders.reduce((sum, order) => sum + amount(order.valorTotal), 0);
        const taskExpenses = tasks
            .filter((task) => task.movement === "Gasto")
            .filter((task) => !filters.desde || (task.createdAt || task.dueDate) >= filters.desde)
            .filter((task) => !filters.hasta || (task.createdAt || task.dueDate) <= filters.hasta)
            .reduce((sum, task) => sum + amount(task.amount), 0);
        const uniqueClients = new Set(incomeOrders.map((order) => clean(order.cliente))).size;
        const serviceCount = filteredOrders.reduce((sum, order) => sum + servicesOf(order).reduce((total, item) => total + Math.max(1, amount(item.service.cantidad)), 0), 0);
        return {
            incomeOrders,
            expenseOrders,
            income,
            collected,
            pending,
            orderExpenses,
            taskExpenses,
            expenses: orderExpenses + taskExpenses,
            uniqueClients,
            serviceCount,
            net: income - orderExpenses - taskExpenses,
            incomplete: filteredOrders.filter((order) => !order.responsable.trim() || !order.cliente.trim() || !order.domiciliario.trim() || (order.pagos ?? []).some((payment) => (payment.tipo ?? "Pago") === "Pago" && !payment.medio.trim())).length,
        };
    }, [filteredOrders, filters.desde, filters.hasta, tasks]);

    const analysis = useMemo(() => {
        const establishment = aggregate(metrics.incomeOrders, (order) => order.cliente, (order) => amount(order.valorTotal));
        const collectedByEstablishment = new Map(metrics.incomeOrders.map((order) => [clean(order.cliente), paymentTotal(order, true)]));
        const servicesByEstablishment = new Map<string, number>();
        const exams = new Map<string, { count: number; revenue: number }>();
        const payments = new Map<string, { amount: number; count: number }>();
        const responsible = aggregate(metrics.incomeOrders, (order) => order.responsable, (order) => amount(order.valorTotal));
        const couriers = aggregate(metrics.incomeOrders.filter((order) => order.domiciliario.trim()), (order) => order.domiciliario, () => 0);
        const serviceRevenue = new Map<string, number>();

        metrics.incomeOrders.forEach((order) => {
            const establishmentName = clean(order.cliente);
            servicesByEstablishment.set(establishmentName, (servicesByEstablishment.get(establishmentName) ?? 0) + servicesOf(order).reduce((sum, item) => sum + Math.max(1, amount(item.service.cantidad)), 0));
            const records = servicesOf(order);
            const serviceValue = records.reduce((sum, item) => sum + amount(item.service.precio) * Math.max(1, amount(item.service.cantidad)), 0);
            records.forEach(({ service }) => {
                const key = clean(service.descripcion);
                const current = exams.get(key) ?? { count: 0, revenue: 0 };
                const units = Math.max(1, amount(service.cantidad));
                current.count += units;
                current.revenue += serviceValue > 0 ? amount(order.valorTotal) * ((amount(service.precio) * units) / serviceValue) : 0;
                exams.set(key, current);
                serviceRevenue.set(key, (serviceRevenue.get(key) ?? 0) + (serviceValue > 0 ? amount(order.valorTotal) * ((amount(service.precio) * units) / serviceValue) : 0));
            });
            (order.pagos ?? []).forEach((payment) => {
                const key = clean(payment.medio);
                const current = payments.get(key) ?? { amount: 0, count: 0 };
                current.amount += amount(payment.valor);
                current.count += 1;
                payments.set(key, current);
            });
        });
        return {
            establishment: establishment.map((item) => ({ ...item, collected: collectedByEstablishment.get(item.label) ?? 0, services: servicesByEstablishment.get(item.label) ?? 0 })),
            responsible,
            couriers: couriers.map((item) => ({ ...item, count: metrics.incomeOrders.filter((order) => clean(order.domiciliario) === item.label).length })),
            exams: [...exams.entries()].map(([label, value]) => ({ label, ...value })).sort((a, b) => b.count - a.count),
            payments: [...payments.entries()].map(([label, value]) => ({ label, ...value })).sort((a, b) => b.amount - a.amount),
            serviceRevenue: [...serviceRevenue.entries()].map(([label, revenue]) => ({ label, revenue })).sort((a, b) => b.revenue - a.revenue),
        };
    }, [metrics]);

    const setFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
    const clearFilters = () => setFilters(initialFilters);
    const totalActivity = analysis.establishment.reduce((sum, item) => sum + item.services, 0);

    return (
        <div className="flex-1 overflow-y-auto bg-[#F6F9FC] p-4 sm:p-6 space-y-5">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#2BB5C3]">IRVET Control</p>
                    <h1 className="text-2xl font-extrabold text-[#1B2B4B]">Dashboard {tab === "general" ? "general" : "analítico"}</h1>
                    <p className="mt-1 text-[13px] text-[#6B7A99]">Supervisión administrativa, financiera y operativa con datos reales.</p>
                </div>
                <div className="flex rounded-xl border border-[#dfe9f5] bg-white p-1 shadow-sm">
                    {(["general", "analitico"] as const).map((item) => (
                        <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-[12px] font-bold ${tab === item ? "bg-[#1B2B4B] text-white" : "text-[#6B7A99]"}`}>
                            {item === "general" ? "Dashboard general" : "Dashboard analítico"}
                        </button>
                    ))}
                </div>
            </header>

            <FilterPanel filters={filters} options={options} onChange={setFilter} onClear={clearFilters} onRefresh={() => setRefresh((value) => value + 1)} analytical={tab === "analitico"} />
            {metrics.incomplete > 0 && <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Hay {number(metrics.incomplete)} órdenes con responsable, establecimiento, domiciliario o medio de pago incompleto. Se agruparon como “Sin información”.</div>}

            {tab === "general" ? (
                <GeneralDashboard metrics={metrics} analysis={analysis} totalClients={clientes.filter((client) => client.estado === "Activo").length} totalMedics={medicos.filter((medic) => medic.estado === "Activo").length} totalResponsibles={responsables.filter((responsible) => responsible.estado === "Activo").length} />
            ) : (
                <AnalyticalDashboard analysis={analysis} totalActivity={totalActivity} />
            )}
        </div>
    );
}

function FilterPanel({ filters, options, onChange, onClear, onRefresh, analytical }: { filters: Filters; options: Record<string, string[]>; onChange: (key: keyof Filters, value: string) => void; onClear: () => void; onRefresh: () => void; analytical: boolean }) {
    const fields: Array<{ key: keyof Filters; label: string; values?: string[]; type?: string }> = [
        { key: "desde", label: "Fecha inicial", type: "date" },
        { key: "hasta", label: "Fecha final", type: "date" },
        { key: "tipoServicio", label: "Tipo de servicio", values: options.tipos },
        { key: "responsable", label: "Responsable", values: options.responsables },
        { key: "establecimiento", label: "Establecimiento", values: options.establecimientos },
        ...(analytical ? [{ key: "examen" as const, label: "Examen", values: options.examenes }, { key: "medioPago" as const, label: "Medio de pago", values: options.medios }] : []),
    ];
    return <section className="rounded-2xl border border-[#dfe9f5] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Filter size={16} className="text-[#2BB5C3]" /><h2 className="text-[13px] font-extrabold text-[#1B2B4B]">Filtros de consulta</h2></div><div className="flex gap-2"><button type="button" onClick={onClear} className="text-[11px] font-bold text-[#6B7A99]">Limpiar</button><button type="button" onClick={onRefresh} className="flex items-center gap-1 rounded-lg bg-[#EAF9FB] px-2.5 py-1.5 text-[11px] font-bold text-[#168996]"><RefreshCw size={13} />Actualizar</button></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{fields.map((field) => <label key={field.key} className="text-[10px] font-bold uppercase tracking-wider text-[#6B7A99]">{field.label}{field.values ? <select value={filters[field.key]} onChange={(event) => onChange(field.key, event.target.value)} className="mt-1 w-full rounded-lg border border-[#dfe9f5] bg-white px-2 py-2 text-[12px] font-normal normal-case text-[#1B2B4B]"><option value="">Todos</option>{field.values.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <span className="relative mt-1 block"><CalendarDays size={13} className="pointer-events-none absolute left-2 top-2.5 text-[#6B7A99]" /><input type={field.type} value={filters[field.key]} onChange={(event) => onChange(field.key, event.target.value)} className="w-full rounded-lg border border-[#dfe9f5] px-2 py-2 pl-7 text-[12px] font-normal normal-case text-[#1B2B4B]" /></span>}</label>)}</div>
    </section>;
}

function GeneralDashboard({ metrics, analysis, totalClients, totalMedics, totalResponsibles }: { metrics: Metrics; analysis: Analysis; totalClients: number; totalMedics: number; totalResponsibles: number }) {
    const cards = [
        { label: "Clientes atendidos", value: number(metrics.uniqueClients), icon: Users, tone: "text-cyan-600 bg-cyan-50", hint: "Clientes únicos en órdenes de ingreso" },
        { label: "Servicios realizados", value: number(metrics.serviceCount), icon: Stethoscope, tone: "text-indigo-600 bg-indigo-50", hint: "Servicios únicos por mascota" },
        { label: "Ingresos facturados", value: money(metrics.income), icon: DollarSign, tone: "text-emerald-600 bg-emerald-50", hint: "Valor total de órdenes de ingreso" },
        { label: "Recaudo efectivo", value: money(metrics.collected), icon: Wallet, tone: "text-teal-600 bg-teal-50", hint: "Pagos registrados como Pago" },
        { label: "Pagos pendientes", value: money(metrics.pending), icon: AlertTriangle, tone: "text-amber-600 bg-amber-50", hint: `${metrics.income ? ((metrics.pending / metrics.income) * 100).toFixed(1) : "0"}% de lo facturado` },
        { label: "Gastos y egresos", value: money(metrics.expenses), icon: CreditCard, tone: "text-rose-600 bg-rose-50", hint: `Órdenes ${money(metrics.orderExpenses)} + tareas ${money(metrics.taskExpenses)}` },
        { label: "Utilidad / pérdida", value: money(metrics.net), icon: BarChart3, tone: metrics.net >= 0 ? "text-violet-600 bg-violet-50" : "text-rose-600 bg-rose-50", hint: "Ingresos facturados menos egresos" },
    ];
    return <><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <KpiCard key={card.label} {...card} />)}</div><div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><Panel title="Ingresos por responsable" icon={Users}><Bars items={analysis.responsible.map((item) => ({ label: item.label, value: item.amount, detail: `${number(item.count)} órdenes` }))} format={money} /></Panel><Panel title="Servicios gestionados por domiciliario" icon={Truck}><Bars items={analysis.couriers.map((item) => ({ label: item.label, value: item.count, detail: `${number(item.count)} servicios` }))} format={number} /></Panel><Panel title="Resumen financiero" icon={Activity}><MetricRows rows={[["Ingresos facturados", money(metrics.income)], ["Recaudo efectivo", money(metrics.collected)], ["Gastos de órdenes", money(metrics.orderExpenses)], ["Gastos de tareas", money(metrics.taskExpenses)], ["Utilidad / pérdida", money(metrics.net)]]} /></Panel><Panel title="Indicadores del sistema" icon={CheckCircle2}><div className="grid grid-cols-3 gap-3"><SmallMetric label="Clientes activos" value={totalClients} /><SmallMetric label="Médicos activos" value={totalMedics} /><SmallMetric label="Responsables activos" value={totalResponsibles} /></div></Panel></div></>;
}

function AnalyticalDashboard({ analysis, totalActivity }: { analysis: Analysis; totalActivity: number }) {
    const totalPayments = analysis.payments.reduce((sum, item) => sum + item.amount, 0);
    return <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><Panel title="Facturación por establecimiento" icon={Building2}><Bars items={analysis.establishment.slice(0, 10).map((item) => ({ label: item.label, value: item.amount, detail: `${money(item.collected)} recaudado · ${number(item.count)} órdenes` }))} format={money} /></Panel><Panel title="Top 10 establecimientos por actividad" icon={ClipboardList}><Ranking items={analysis.establishment.slice().sort((a, b) => b.services - a.services).slice(0, 10).map((item) => ({ label: item.label, value: item.services, percentage: totalActivity ? (item.services / totalActivity) * 100 : 0 }))} /></Panel><Panel title="Medios de pago: valor recibido" icon={Wallet}><Donut items={analysis.payments.map((item) => ({ label: item.label, value: item.amount }))} total={totalPayments} /></Panel><Panel title="Medios de pago: transacciones" icon={CreditCard}><Bars items={analysis.payments.map((item) => ({ label: item.label, value: item.count, detail: `${money(item.amount)} recibidos` }))} format={number} /></Panel><Panel title="Ingresos por número de exámenes" icon={Stethoscope}><Bars items={analysis.exams.slice(0, 10).map((item) => ({ label: item.label, value: item.revenue, detail: `${number(item.count)} exámenes distribuidos` }))} format={money} /></Panel><Panel title="Cantidad de exámenes y gasto asociado" icon={BarChart3}><p className="mb-3 text-[11px] text-[#6B7A99]">No existe costo individual por examen en los datos actuales; se muestra la cantidad registrada y el gasto de órdenes por separado.</p><Bars items={analysis.exams.slice(0, 10).map((item) => ({ label: item.label, value: item.count, detail: "Costo individual no disponible" }))} format={number} /></Panel><Panel title="Top 10 por ingresos" icon={DollarSign}><Ranking items={analysis.establishment.slice(0, 10).map((item) => ({ label: item.label, value: item.amount, secondary: `Recaudado: ${money(item.collected)}` }))} format={money} /></Panel><Panel title="Ingresos distribuidos por servicio" icon={Activity}><Bars items={analysis.serviceRevenue.slice(0, 10).map((item) => ({ label: item.label, value: item.revenue }))} format={money} /></Panel></div>;
}

function KpiCard({ label, value, icon: Icon, tone, hint }: { label: string; value: string; icon: typeof Activity; tone: string; hint: string }) { return <div className="rounded-2xl border border-[rgba(27,43,75,0.06)] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7A99]">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={16} /></span></div><p className="mt-3 text-xl font-extrabold text-[#1B2B4B]">{value}</p><p className="mt-1 text-[10px] text-[#6B7A99]">{hint}</p></div>; }
function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: ReactNode }) { return <section className="rounded-2xl border border-[rgba(27,43,75,0.06)] bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF9FB] text-[#168996]"><Icon size={16} /></span><h2 className="text-[15px] font-extrabold text-[#1B2B4B]">{title}</h2></div>{children}</section>; }
function Bars({ items, format }: { items: Array<{ label: string; value: number; detail?: string }>; format: (value: number) => string }) { const max = Math.max(...items.map((item) => item.value), 0); return items.length ? <div className="space-y-3">{items.map((item) => <div key={item.label}><div className="mb-1 flex justify-between gap-3 text-[11px]"><span className="min-w-0 truncate font-bold text-[#4D5F7A]" title={item.label}>{item.label}</span><span className="shrink-0 font-extrabold text-[#1B2B4B]">{format(item.value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF3F8]"><div className="h-full rounded-full bg-[#2BB5C3]" style={{ width: `${max ? Math.max(3, (item.value / max) * 100) : 0}%` }} /></div>{item.detail && <p className="mt-1 text-[10px] text-[#6B7A99]">{item.detail}</p>}</div>)}</div> : <EmptyState />; }
function Ranking({ items, format = number }: { items: Array<{ label: string; value: number; percentage?: number; secondary?: string }>; format?: (value: number) => string }) { return items.length ? <div className="space-y-2">{items.map((item, index) => <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-3 py-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EAF9FB] text-[10px] font-extrabold text-[#168996]">{index + 1}</span><span className="min-w-0 flex-1 truncate text-[11px] font-bold text-[#4D5F7A]" title={item.label}>{item.label}</span><span className="text-right text-[11px] font-extrabold text-[#1B2B4B]">{format(item.value)}{item.percentage !== undefined && <small className="ml-1 font-normal text-[#6B7A99]">({item.percentage.toFixed(1)}%)</small>}{item.secondary && <small className="block font-normal text-[#6B7A99]">{item.secondary}</small>}</span></div>)}</div> : <EmptyState />; }
function Donut({ items, total }: { items: Array<{ label: string; value: number }>; total: number }) { const colors = ["#2BB5C3", "#5865F2", "#10B981", "#F59E0B", "#E11D48", "#8B5CF6"]; return items.length ? <div className="flex flex-col items-center gap-4 sm:flex-row"><div className="h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${items.reduce((result, item, index) => { const start = result.offset; const end = start + (total ? item.value / total : 0) * 100; result.parts.push(`${colors[index % colors.length]} ${start}% ${end}%`); result.offset = end; return result; }, { offset: 0, parts: [] as string[] }).parts.join(", ")})` }}><div className="m-7 flex h-18 w-18 items-center justify-center rounded-full bg-white text-center text-[10px] font-bold text-[#6B7A99]">{money(total)}</div></div><div className="space-y-2">{items.map((item, index) => <div key={item.label} className="flex items-center gap-2 text-[11px]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{item.label}: <b>{money(item.value)}</b></div>)}</div></div> : <EmptyState />; }
function MetricRows({ rows }: { rows: string[][] }) { return <div className="space-y-3">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-[#EEF3F8] pb-2 text-[12px]"><span className="font-bold text-[#6B7A99]">{label}</span><span className="font-extrabold text-[#1B2B4B]">{value}</span></div>)}</div>; }
function SmallMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-[#F8FAFC] p-3 text-center"><p className="text-[10px] font-bold text-[#6B7A99]">{label}</p><p className="mt-1 text-xl font-extrabold text-[#1B2B4B]">{number(value)}</p></div>; }
function EmptyState() { return <p className="py-5 text-center text-[12px] text-[#6B7A99]">No hay registros para los filtros seleccionados.</p>; }
