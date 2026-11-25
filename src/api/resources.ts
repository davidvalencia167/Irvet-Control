import type { ComboCatalogo, ServicioCatalogo } from "../constants/services";
import type { Cliente, Medico, Orden, Responsable } from "../types";
import type { DailyTask, TaskCategory, TaskForm } from "../types/tasks";
import { getCurrentUser, setSessionMarker } from "./auth";



const API_URL = "https://sistemaintegralirvet.com/irvet-api/api";

export async function request<T>(endpoint:string, options: RequestInit = {},): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        if (response.status === 401) {
            setSessionMarker(false);
            window.dispatchEvent(new Event("irvet:unauthorized"));
        }
        const detail = data?.message
            ?? data?.error
            ?? (Array.isArray(data?.errors) ? data.errors.join(", ") : "")
            ?? "";
        throw new Error(detail ? `${detail} (HTTP ${response.status})` : `Error en la solicitud (HTTP ${response.status})`);
    }

    return data as T;
}

export const api = {
    async users() {
        return request<{ users: Responsable[] }>("/users.php");
    },

    async clients() {
        return request<{ clients: Cliente[] }>("/clients.php");
    },

    async saveClient(client: Omit<Cliente, "id">, id?: string,) {
        return request<{client: Cliente}>("/clients.php", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify({ ...client, id }),
        });
    },

    async toggleClient(id: string, estado: Cliente["estado"]) {
        return request("/clients.php", {
            method: "PATCH",
            body: JSON.stringify({ id, estado }),
        });
    },

    async veterinarians() {
        return request<{ veterinarians: Medico[] }>(
      "/veterinarians.php",
        );
    },

    async saveVeterinarian(veterinarian: Omit<Medico, "id">, id?: string,) {
        return request<{ veterinarian: Medico }>(
            "/veterinarians.php", {
                method: id ? "PUT" : "POST",
                body: JSON.stringify({ ...veterinarian, id }),
            },
        );
    },

    async toggleVeterinarian(id: string, estado: Medico["estado"],) {
        return request("/veterinarians.php", {
            method: "PATCH",
            body: JSON.stringify({id, estado})
        });
    },

    async catalog() {
        return request<{
      catalog: Record<string, ServicioCatalogo[]>;
    }>("/catalog.php");
    },

    async addService(service: ServicioCatalogo) {
        return request("/catalog.php", {
            method: "POST",
            body: JSON.stringify(service),
        });
    },

    async deleteService(categoria: string, nombre: string) {
        return request("/catalog.php", {
            method: "DELETE",
            body: JSON.stringify({ categoria, nombre })
        });
    },

    async combos() {
        return request<{ combos: ComboCatalogo[] }>(
            "/combos.php",
        );
    },

    async addCombo(combo: ComboCatalogo) {
        return request("/combos.php", {
            method: "POST",
            body: JSON.stringify(combo)
        });
    },

    async deleteCombo(id: string) {
        return request("/combos.php", {
            method: "DELETE",
            body: JSON.stringify({ id })
        });
    },

    async orders() {
        return request<{ orders: Orden[]}>("/orders.php");
    },

    async saveOrder(order: Orden) {
        return request<{ order: Orden}>("/orders.php", {
            method: "POST",
            body: JSON.stringify(order),
        });
    },

    async updateOrder(order: Orden) {
        return request<{ order: Orden}>("/orders.php", {
            method: "PUT",
            body: JSON.stringify(order),
        });
    },

    async deleteOrder(id: string) {
        return request("/orders.php", {
            method: "DELETE",
            body: JSON.stringify({ id }),
        });
    },

    async tasks() {
        return request<{
            tasks: DailyTask[];
            categories: TaskCategory[];
        }>("/tasks.php");
    },

    async saveTask(task: TaskForm, id?: string) {
        return request<{ task: DailyTask }>("/tasks.php", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify({
            ...task,
            id,
            }),
        });
    },

    async deleteTask(id: string) {
        return request("/tasks.php", {
            method: "DELETE",
            body: JSON.stringify({ id }),
        });
    },

    async createTaskCategory(name: string) {
        return request<{ category: TaskCategory }>("/task-categories.php", {
            method: "POST",
            body: JSON.stringify({ name }),
        });
    },

    currentUser: getCurrentUser,
};