export type DispatchStatus =
  | "Pendiente"
  | "Por asignar"
  | "Asignado"
  | "Mensajero en camino"
  | "Llegó al origen"
  | "Muestra recogida"
  | "En tránsito"
  | "Llegó al destino"
  | "Entregado"
  | "Cancelado"
  | "Incidencia";

export type DispatchPriority = "Normal" | "Prioritaria" | "Urgente";

export type DispatchServiceType =
  | "Recolección de muestra"
  | "Traslado a laboratorio"
  | "Entrega de resultados"
  | "Entrega de materiales"
  | "Recolección pendiente"
  | "Otro";

export interface DispatchCoordinate {
  latitude: number;
  longitude: number;
}

export interface DispatchAddress {
  address: string;
  coordinate?: DispatchCoordinate | null;
}

export interface DispatchEvent {
  id: string;
  status: DispatchStatus;
  createdAt: string;
  createdBy: string;
  note?: string;
  recipientName?: string | null;
  confirmation?: string | null;
}

export interface DispatchRequest {
  id: string;
  code: string;
  orderId?: string | null;
  clientId?: string | null;
  clientName: string;
  contactName: string;
  contactPhone: string;
  serviceType: DispatchServiceType;
  description: string;
  origin: DispatchAddress;
  destination: DispatchAddress;
  priority: DispatchPriority;
  requestedAt: string;
  courierId?: string | null;
  courierName?: string | null;
  status: DispatchStatus;
  estimatedArrival?: string | null;
  completedAt?: string | null;
  events: DispatchEvent[];
}

export interface CourierLocation {
  courierId: string;
  coordinate: DispatchCoordinate;
  accuracyMeters?: number | null;
  recordedAt: string;
  availability?:
    | "Disponible"
    | "Asignado"
    | "En ruta"
    | "Ocupado"
    | "En descanso"
    | "Desconectado";
}

export type DispatchCreateInput = Omit<
  DispatchRequest,
  | "id"
  | "code"
  | "requestedAt"
  | "courierId"
  | "courierName"
  | "status"
  | "estimatedArrival"
  | "completedAt"
  | "events"
>;

export interface DispatchStatusDetails {
  note?: string;
  recipientName?: string;
  confirmation?: string;
}

export type CourierAvailability = NonNullable<CourierLocation["availability"]>;

export interface DispatchRouteStop {
  dispatchId: string;
  dispatchCode: string;
  stopType: "origin" | "destination";
  sequence: number;
  address: string;
  coordinate: DispatchCoordinate;
  priority: DispatchPriority;
  dispatchStatus?: DispatchStatus;
}

export interface DispatchRoute {
  id: string;
  courierId: string;
  courierName: string;
  distanceKm: number;
  status: "Sugerida" | "Activa" | "Completada" | "Reemplazada";
  startCoordinate?: DispatchCoordinate | null;
  stops: DispatchRouteStop[];
}

export interface CourierRecommendation {
  courier: import("./index").Responsable;
  distanceKm: number;
  pendingCount: number;
  score: number;
  reason: string;
}
