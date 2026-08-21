
export interface PetEntry {
    id: string;
    nombre: string;
    propietario: string;
    telefono: string;
    correo: string;
    especie: string;
    raza: string;
    sexo: string;
    edad: string;
    horaEnvio: string;
    estadoMuestra: "Normal" | "Coagulada";
}

export interface PaymentRow {
    id: string;
    medio: string;
    valor: string;
}

export interface AuditEntry {
    usuario: string;
    fecha: string;
    hora: string;
    campo: string;
    valorAnterior: string;
    valorNuevo: string;
    motivo: string;
}

export interface Orden {
    id: string;
    factura: string;
    fecha: string;
    numeroOrden: string;
    responsable: string;
    cliente: string;
    tipoServicio: string;
    descripcionServicio: string;
    cantidad: string;
    nombreMedico: string;
    matriculaMedico: string;
    mascotas: PetEntry[];
    domiciliario: string;
    horaLlamada: string;
    horaLlegada: string;
    prioridad: "Normal" | "Prioritaria";
    valorTotal: string;
    pagos: PaymentRow[];
    estadoPago: "Pagado" | "Pendiente por pago";
    movimiento: "Ingreso" | "Gasto";
    observaciones: string;
    auditoria: AuditEntry[];
}

export type FormOrden = Omit<Orden, "id" | "factura" | "auditoria">;