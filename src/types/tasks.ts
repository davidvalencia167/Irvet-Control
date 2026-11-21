
export const TASK_STATUSES = [
    "NO INICIADO",
    "EN PROGRESO",
    "EN ESPERA",
    "BLOQUEADO",
    "CANCELADO",
    "COMPLETADO",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskMovement = "Actividad" | "Gasto";

export interface TaskCategory {
    id: string;
    name: string;
}

export interface DailyTask {
    id: string;
    description: string;
    status: TaskStatus;
    category: string;
    movement: TaskMovement;
    amount: string;
    responsible: string;
    dueDate: string;
    completedDate: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskForm {
    description: string;
    status: TaskStatus;
    category: string;
    movement: TaskMovement;
    amount: string;
    responsible: string;
    dueDate: string;
    completedDate: string;
    notes: string;
}