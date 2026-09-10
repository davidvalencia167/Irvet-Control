export interface ServicioOrden {
    id: string;
    tipo: string;
    descripcion: string;
    categoria: string;
    precio: number;
    cantidad: number;
}

export interface PetEntry {
    id: string;
    numeroOrden: string;
    nombre: string;
    propietario: string;
    telefono: string;
    correo: string;
    especie: string;
    raza: string;
    sexo: string;
    edad: string;
    edadAnios: string;
    edadMeses: string;
    horaEnvio: string;
    estadoMuestra: "Normal" | "Coagulada";
    servicios: ServicioOrden[];
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
    horaSolicitud: string;
    numeroOrden: string;
    responsable: string;
    cliente: string;
    tipoServicio: string;
    descripcionServicio: string;
    serviciosSeleccionados: string[];
    cantidad: string;
    nombreMedico: string;
    matriculaMedico: string;
    mascotas: PetEntry[];
    domiciliario: string;
    horaLlamada: string;
    horaLlegada: string;
    prioridad: "Normal" | "Prioritaria" | "Urgente";
    valorTotal: string;
    pagos: PaymentRow[];
    estadoPago: "Pagado" | "Pago parcial" | "Pendiente por pago";
    movimiento: "Ingreso" | "Gasto";
    observaciones: string;
    estadoOrden: "Pendiente de recepción" | "En proceso" | "Completada";
    auditoria: AuditEntry[];
}

export type FormOrden = Omit<Orden, "id" | "factura" | "auditoria">;

export interface Cliente {
    id: string;
    nombre: string;
    nit: string;
    representanteLegal: string;
    direccion: string;
    telefono: string;
    correo: string;
    aniversario: string;
    estado: "Activo" | "Inactivo";
    observaciones: string;
}

export interface Medico {
    id: string;
    nombre: string;
    matricula: string;
    telefono: string;
    correo: string;
    clinica: string;
    fechaCumpleanos: string;
    estado: "Activo" | "Inactivo";
    observaciones: string;
}

export interface Responsable {
    id: string;
    nombre: string;
    usuario: string;
    correo: string;
    rol: "Representante Legal" | "Administrador" | "Asistente Administrativo" | "Domiciliario multiservicios" | "Responsable / Operador";
    estado: "Activo" | "Inactivo";
}
