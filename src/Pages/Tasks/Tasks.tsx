import { useMemo, useState } from "react";
import { TASK_STATUSES, type DailyTask, type TaskCategory, type TaskForm, type TaskMovement, type TaskStatus } from "../../types/tasks";
import type { Responsable } from "../../types";
import { CalendarDays, Check, Edit3, Plus, Search, Trash2, UserRound, X } from "lucide-react";


interface TaskProps {
    tasks: DailyTask[];
    categories: TaskCategory[];
    responsables: Responsable[];
    currentUser: string;
    onSave: (data: TaskForm, id?: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onCreateCategory: (name: string) => Promise<void>;
}

const DEFAULT_CATEGORIES = [
    "Servicios",
    "Seguridad",
    "Quincena",
    "Proveedor",
    "Varios",
    "Contador",
    "Otros",
];

const emptyForm: TaskForm = {
    description: "",
    status: "NO INICIADO",
    category: "Otros",
    movement: "Gasto",
    amount: "",
    responsible: "",
    dueDate: "",
    completedDate: "",
    notes: "",
};

const statusColors: Record<TaskStatus, string> = {
    "NO INICIADO": "bg-slate-100 text-slate-700",
    "EN PROGRESO": "bg-blue-100 text-blue-700",
    "EN ESPERA": "bg-yellow-100 text-yellow-700",
    BLOQUEADO: "bg-red-100 text-red-700",
    CANCELADO: "bg-gray-100 text-gray-500",
    COMPLETADO: "bg-green-100 text-green-700",
};

function formatDate(value: string) {
    if(!value) return "Sin fecha";

    const date = new Date(`${value}T00:00:00`);

    if(Number.isNaN(date.getTime())) return "Sin fecha";

    return new Intl.DateTimeFormat("es-CO").format(date);
}

function getRemainingDays(task: DailyTask) {
  if (!task.dueDate || task.status === "COMPLETADO") return null;

  const today = new Date();
  const dueDate = new Date(`${task.dueDate}T00:00:00`);

  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function remainingDaysLabel(days: number | null) {
  if (days === null) return "—";
  if (days < 0) return `Vencida hace ${Math.abs(days)} días`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Falta 1 día";
  return `Faltan ${days} días`;
}

export default function Tasks({ tasks, categories, responsables, currentUser, onSave, onDelete, onCreateCategory }: TaskProps) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Todas");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
    const [form, setForm] = useState<TaskForm>(emptyForm);
    const [newCategory, setNewCategory] = useState("");
    const [saving, setSaving] = useState(false);

    const allCategories = useMemo(() => {
        return Array.from(
            new Set([
                ...DEFAULT_CATEGORIES,
                ...categories.map((category) => category.name),
            ]),
        ).sort((a, b) => a.localeCompare(b));
    }, [categories]);


    const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...tasks]
      .filter((task) => {
        const matchesSearch =
          !normalizedSearch ||
          [
            task.description,
            task.category,
            task.status,
            task.movement,
            task.responsible,
            task.notes,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesCategory =
          categoryFilter === "Todas" || task.category === categoryFilter;

        const matchesStatus =
          statusFilter === "Todos" || task.status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }, [tasks, search, categoryFilter, statusFilter]);

    const pendingCount = tasks.filter(
    (task) => task.status !== "COMPLETADO" && task.status !== "CANCELADO",
  ).length;

    const completedCount = tasks.filter(
        (task) => task.status === "COMPLETADO",
    ).length;

    const overdueCount = tasks.filter((task) => {
        const days = getRemainingDays(task);
        return days !== null && days < 0;
    }).length;

  const openNewTask = () => {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      category: allCategories.includes("Otros") ? "Otros" : allCategories[0],
      responsible: currentUser,
    });
    setShowForm(true);
  };

  const openEditTask = (task: DailyTask) => {
    setEditingTask(task);
    setForm({
      description: task.description,
      status: task.status,
      category: task.category,
      movement: task.movement ?? "Gasto",
      amount: task.amount ?? "",
      responsible: task.responsible ?? currentUser,
      dueDate: task.dueDate,
      completedDate: task.completedDate,
      notes: task.notes,
    });
    setShowForm(true);
  };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditingTask(null);
        setForm(emptyForm);
    };

    const handleSave = async () => {
        if (!form.description.trim()) {
        window.alert("La descripción de la tarea es obligatoria.");
        return;
        }

        if (!form.category.trim()) {
        window.alert("La categoría es obligatoria.");
        return;
        }

        if (form.movement === "Gasto" && Number(form.amount) <= 0) {
        window.alert("Ingrese un valor mayor que cero para el gasto.");
        return;
        }

        setSaving(true);

        try {
        await onSave(
            {
            ...form,
            description: form.description.trim(),
            category: form.category.trim(),
            },
            editingTask?.id,
        );

        closeForm();
        } finally {
        setSaving(false);
        }
    };

    const handleStatusChange = async (
        task: DailyTask,
        status: TaskStatus,
    ) => {
        const completedDate =
        status === "COMPLETADO"
            ? task.completedDate || new Date().toISOString().slice(0, 10)
            : "";

        await onSave(
        {
            description: task.description,
            status,
            category: task.category,
            movement: task.movement ?? "Gasto",
            amount: task.amount ?? "",
            responsible: task.responsible ?? currentUser,
            dueDate: task.dueDate,
            completedDate,
            notes: task.notes,
        },
        task.id,
        );
    };

    const handleCreateCategory = async () => {
        const value = newCategory.trim();

        if (!value) return;

        if (allCategories.some((category) => category.toLowerCase() === value.toLowerCase())) {
        window.alert("Esa categoría ya existe.");
        return;
        }

        await onCreateCategory(value);
        setForm((current) => ({ ...current, category: value }));
        setNewCategory("");
    };


    return(
        <section className="space-y-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-extrabold text-[#1B2B4B]">
                        Tareas diarias
                    </h1>
                    <p className="mt-1 text-[13px] text-[#6B7A99]">
                        Control de pagos, pendientes y actividades administrativas.
                    </p>
                </div>

                <button type="button" onClick={openNewTask} className="inline-flex items-center gap-2 rounded-xl bg-[#2BB5C3] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#239ba8]">
                    <Plus size={16}/>
                    Nueva tarea
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-[#6B7A99]">
                        Pendientes
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[#1B2B4B]">
                        {pendingCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-[#6B7A99]">
                        Vencidas
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-red-600">
                        {overdueCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase text-[#6B7A99]">
                        Completadas
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-green-600">
                        {completedCount}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <div className="relative min-w-64 flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarea, pago o proveedor..." className="w-full rounded-xl border border-slate-200 bg-[#F4F7FA] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2BB5C3]" />
                    </div>

                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm">
                        <option value="Todas">Todas las categorías</option>
                        {
                            allCategories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                    </select>

                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm">
                        <option value="Todos">Todos los estatus</option>
                        {
                            TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-262.5 text-left">
                        <thead className="bg-[#F4F7FA] text-[10px] uppercase tracking-wide text-[#6B7A99]">
                            <tr>
                                <th className="px-5 py-4">Descripción</th>
                                <th className="px-5 py-4">Categoría</th>
                                <th className="px-5 py-4">Tipo</th>
                                <th className="px-5 py-4">Valor</th>
                                <th className="px-5 py-4">Responsable</th>
                                <th className="px-5 py-4">Estatus</th>
                                <th className="px-5 py-4">Fecha de vencimiento</th>
                                <th className="px-5 py-4">Días restantes</th>
                                <th className="px-5 py-4">Fecha de pago</th>
                                <th className="px-5 py-4">Acciones</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {
                                filteredTasks.map((task) => {
                                    const remainingDays = getRemainingDays(task);
                                    const isOverdue = remainingDays !== null && remainingDays < 0;

                                    return(
                                        <tr key={task.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-[#1B2B4B]">
                                                    {task.description}
                                                </p>
                                                {
                                                    task.notes && (
                                                        <p className="mt-1 max-w-xs truncate text-xs text-[#6B7A99]">
                                                            {task.notes}
                                                        </p>
                                                    )}
                                            </td>

                                            <td className="px-4 py-4 text-sm text-[#1B2B4B]">
                                                {task.category}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${task.movement === "Gasto" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                                                    {task.movement ?? "Actividad"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-sm font-bold text-[#1B2B4B]">
                                                {task.amount ? `$${Number(task.amount).toLocaleString("es-CO")}` : "—"}
                                            </td>

                                            <td className="px-4 py-4 text-sm text-[#1B2B4B]">
                                                <span className="inline-flex items-center gap-1">
                                                    <UserRound size={14} />
                                                    {task.responsible || "Sin asignar"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4">
                                                <select value={task.status} onChange={(event) => void handleStatusChange(task, event.target.value as TaskStatus)} className={`rounded-lg border-0 px-2 py-1 text-[10px] font-bold ${statusColors[task.status]}`}>
                                                    {
                                                        TASK_STATUSES.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-4 text-sm text-[#1B2B4B]">
                                                <span className="inline-flex items-center gap-1">
                                                    <CalendarDays size={14}/>
                                                    {formatDate(task.dueDate)}
                                                </span>
                                            </td>

                                            <td className={`px-4 py-4 text-sm font-bold ${ isOverdue ? "text-red-600" : "text-[#1B2B4B]"}`}>
                                                {remainingDaysLabel(remainingDays)}
                                            </td>

                                            <td className="px-4 py-4 text-sm text-[#1B2B4B]">
                                                {formatDate(task.completedDate)}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => openEditTask(task)} className="rounded-lg p-2 text-[#1B2B4B] hover:bg-slate-100" title="Editar">
                                                        <Edit3 size={15}/>
                                                    </button>

                                                    <button type="button" onClick={() => {if (window.confirm("¿Deseas eliminar esta tarea?",)) {void onDelete(task.id);}}} className="rounded-lg p-2 text-red-600 hover:bg-red-50" title="Eliminar">
                                                        <Trash2 size={15}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {
                                    filteredTasks.length === 0 && (
                                        <tr>
                                            <td colSpan={10} className="px-5 py-12 text-center text-sm text-[#6B7A99]">
                                                No hay tareas registradas.
                                            </td>
                                        </tr>
                                    )}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#1B2B4B]">
                                        {editingTask ? "Editar tarea" : "Nueva tarea"}
                                    </h2>
                                    <p className="text-xs text-[#6B7A99]">
                                        Registra tareas, pagos y vencimientos.
                                    </p>
                                </div>

                                <button type="button" onClick={closeForm} className="rounded-lg p-2 hover:bg-slate-100">
                                    <X size={18}/>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="col-span-2 text-sm font-semibold text-[#1B2B4B]">
                                    Descripción de la tarea o pago
                                    <input value={form.description} onChange={(event) => setForm((current) => ({...current, description: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal outline-none focus:border-[#2BB5C3]" placeholder="Ej. Pagar recibo de energía" />
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Categoría
                                    <select value={form.category} onChange={(event) => setForm((current) => ({...current, category: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal">
                                        {
                                            allCategories.map((category) => (
                                                <option key={category} value={category}>
                                                    {category}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Estatus
                                    <select value={form.status} onChange={(event) => setForm((current) => ({...current, status: event.target.value as TaskStatus, completedDate: event.target.value === "COMPLETADO" ? current.completedDate || new Date().toISOString().slice(0, 10): current.completedDate,}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal">
                                        {
                                            TASK_STATUSES.map((status) => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                    </select>
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Tipo de registro
                                    <select value={form.movement} onChange={(event) => setForm((current) => ({...current, movement: event.target.value as TaskMovement}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal">
                                        <option value="Gasto">Gasto</option>
                                        <option value="Actividad">Actividad</option>
                                    </select>
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Valor del gasto
                                    <input type="number" min="0" step="1" value={form.amount} onChange={(event) => setForm((current) => ({...current, amount: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal" placeholder="Ej. 70000" />
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Responsable
                                    <select value={form.responsible} onChange={(event) => setForm((current) => ({...current, responsible: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal">
                                        <option value="">Sin asignar</option>
                                        {responsables.map((responsable) => <option key={responsable.id} value={responsable.nombre}>{responsable.nombre}</option>)}
                                    </select>
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Fecha de vencimiento
                                    <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({...current, dueDate: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal" />
                                </label>

                                <label className="text-sm font-semibold text-[#1B2B4B]">
                                    Fecha de pago o realización
                                    <input type="date" value={form.completedDate} onChange={(event) => setForm((current) => ({...current, completedDate: event.target.value}))} className="mt-1 w-full rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal" />
                                </label>

                                <label className="col-span-2 text-sm font-semibold text-[#1B2B4B]">
                                    Notas
                                    <textarea value={form.notes} onChange={(event) => setForm((current) => ({...current, notes: event.target.value}))} rows={3} className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm font-normal" placeholder="Información adicional"/>
                                </label>

                                <div className="col-span-2 rounded-xl border border-dashed border-slate-300 p-3">
                                    <p className="mb-2 text-xs font-bold uppercase text-[#6B7A99]">
                                        Crear categoría
                                    </p>

                                    <div className="flex gap-2">
                                        <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nombre de la nueva categoría" className="flex-1 rounded-xl border border-slate-200 bg-[#F4F7FA] px-3 py-2 text-sm" />
                                        <button type="button" onClick={() => void handleCreateCategory()} className="rounded-xl bg-[#1B2B4B] px-3 py-2 text-xs font-bold text-white">
                                            Crear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-[#1B2B4B]">
                                    Cancelar
                                </button>

                                <button type="button" disabled={saving} onClick={() => void handleSave()} className="inline-flex items-center gap-2 rounded-xl bg-[#2BB5C3] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                                    <Check size={16}/>
                                    {saving ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                )};
        </section>
    );
}