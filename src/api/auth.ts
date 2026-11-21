

export interface AuthUser {
    id: number;
    nombre: string;
    usuario: string;
    correo: string;
    rol:
      | "Representante Legal"
      | "Administrador"
      | "Asistente Administrativo"
      | "Domiciliario multiservicios"
      | "Responsable / Operador";
    estado: "Activo" | "Inactivo";
}

const API_URL = "https://sistemaintegralirvet.com/irvet-api/api";
const SESSION_KEY = "irvet-auth-session";

function hasSessionMarker() {
    try {
        return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
        return false;
    }
}

function setSessionMarker(active: boolean) {
    try {
        if (active) {
            sessionStorage.setItem(SESSION_KEY, "1");
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    } catch {
        // The API session cookie remains the source of authentication.
    }
}

async function request<T>(endpoint:string, options: RequestInit = {},): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message ?? "Error de comunicación con el servidor");
    }
    return data as T;
}

export function login(usuario: string, password: string) {
    return request<{user: AuthUser}>("/login.php", {
        method: "POST",
        body: JSON.stringify({usuario, password}),
    }).then((result) => {
        setSessionMarker(true);
        return result;
    });
}

export function getCurrentUser(): Promise<{user: AuthUser} | null> {
    if (!hasSessionMarker()) {
        return Promise.resolve(null);
    }

    return request<{user: AuthUser}>("/me.php").catch((error) => {
        if (error instanceof Error && error.message === "No autenticado") {
            setSessionMarker(false);
            return null;
        }
        throw error;
    });
}

export function logout() {
    return request<void>("/logout.php", {
        method: "POST",
    }).finally(() => {
        setSessionMarker(false);
    });
}

export function changePassword(currentPassword: string, newPassword: string,) {
    return request<{ message: string }>("/change-password.php", {
        method: "POST",
        body: JSON.stringify({
            currentPassword,
            newPassword,
        }),
    });
}

export function requestPasswordReset(correo: string) {
    return request<{message: string}>("/forgot-password.php", {
        method: "POST",
        body: JSON.stringify({correo}),
    });
}

export function resetPassword(token: string, newPassword: string,) {
    return request<{message: string}>("/reset-password.php", {
        method: "POST",
        body: JSON.stringify({
            token,
            newPassword,
        }),
    });
}