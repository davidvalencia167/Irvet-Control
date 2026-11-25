import type { Responsable } from "../types";
import type {
  CourierLocation,
  CourierRecommendation,
  DispatchRequest,
} from "../types/dispatch";

const ACTIVE_STATUSES = new Set([
  "Asignado",
  "Mensajero en camino",
  "Llegó al origen",
  "Muestra recogida",
  "En tránsito",
  "Llegó al destino",
  "Incidencia",
]);

function isCoordinateValid(location: CourierLocation | undefined, now: number) {
  const recordedAt = location ? new Date(location.recordedAt).getTime() : NaN;
  return Boolean(
    location &&
      Number.isFinite(recordedAt) &&
      now - recordedAt >= 0 &&
      now - recordedAt <= 5 * 60 * 1000 &&
      Number.isFinite(location.coordinate.latitude) &&
      Number.isFinite(location.coordinate.longitude) &&
      Math.abs(location.coordinate.latitude) <= 90 &&
      Math.abs(location.coordinate.longitude) <= 180,
  );
}

export function distanceInKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function recommendCouriers(
  request: DispatchRequest,
  couriers: Responsable[],
  locations: CourierLocation[],
  dispatches: DispatchRequest[],
  now: number,
): CourierRecommendation[] {
  if (!request.origin.coordinate) return [];

  return couriers
    .filter((courier) => courier.estado === "Activo")
    .flatMap((courier) => {
      const location = locations.find((item) => item.courierId === courier.id);
      if (!location || !isCoordinateValid(location, now)) return [];
      if (
        !location.availability ||
        ["Ocupado", "En descanso", "Desconectado"].includes(
          location.availability,
        )
      ) {
        return [];
      }

      const pendingCount = dispatches.filter(
        (dispatch) =>
          dispatch.courierId === courier.id &&
          ACTIVE_STATUSES.has(dispatch.status),
      ).length;
      const distanceKm = distanceInKm(
        location.coordinate,
        request.origin.coordinate!,
      );
      const workloadWeight =
        request.priority === "Urgente"
          ? 0.5
          : request.priority === "Prioritaria"
            ? 1
            : 1.5;
      const score = distanceKm + pendingCount * workloadWeight;

      return [
        {
          courier,
          distanceKm,
          pendingCount,
          score,
          reason: `${distanceKm.toFixed(1)} km en línea recta del origen y ${pendingCount} servicios activos.`,
        },
      ];
    })
    .sort((left, right) => left.score - right.score);
}

export function summarizeDispatches(dispatches: DispatchRequest[]) {
  return {
    total: dispatches.length,
    pending: dispatches.filter((item) =>
      ["Pendiente", "Por asignar"].includes(item.status),
    ).length,
    onRoute: dispatches.filter((item) =>
      ["Mensajero en camino", "Muestra recogida", "En tránsito"].includes(
        item.status,
      ),
    ).length,
    completed: dispatches.filter((item) => item.status === "Entregado").length,
    incidents: dispatches.filter((item) => item.status === "Incidencia").length,
  };
}

export function courierWorkload(
  courierId: string,
  dispatches: DispatchRequest[],
) {
  return dispatches.filter(
    (dispatch) =>
      dispatch.courierId === courierId &&
      ACTIVE_STATUSES.has(dispatch.status),
  ).length;
}
