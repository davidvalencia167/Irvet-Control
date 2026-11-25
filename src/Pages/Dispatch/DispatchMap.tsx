import { useEffect, useMemo } from "react";
import { MapPinned } from "lucide-react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Cliente, Responsable } from "../../types";
import type {
  CourierLocation,
  DispatchCoordinate,
  DispatchRoute,
  DispatchRequest,
} from "../../types/dispatch";
import "leaflet/dist/leaflet.css";

interface Props {
  clients: Cliente[];
  dispatches: DispatchRequest[];
  locations: CourierLocation[];
  couriers: Responsable[];
  route?: DispatchRoute | null;
  selectedCourierId: string | null;
  now: number;
  onSelectCourier: (courierId: string) => void;
}

function isValidCoordinate(
  coordinate: DispatchCoordinate | null | undefined,
): coordinate is DispatchCoordinate {
  return Boolean(
    coordinate &&
      Number.isFinite(coordinate.latitude) &&
      Number.isFinite(coordinate.longitude) &&
      Math.abs(coordinate.latitude) <= 90 &&
      Math.abs(coordinate.longitude) <= 180,
  );
}

function FitMapToPoints({ points }: { points: DispatchCoordinate[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 13);
    } else if (points.length > 1) {
      map.fitBounds(
        points.map(
          (point) => [point.latitude, point.longitude] as [number, number],
        ),
        { padding: [40, 40], maxZoom: 14 },
      );
    }
  }, [map, points]);

  return null;
}

function courierColor(status: string) {
  if (
    status === "Sin señal reciente" ||
    status === "Desconectado" ||
    status === "Estado no reportado"
  ) {
    return "#94a3b8";
  }
  if (status === "Ocupado" || status === "En ruta") return "#f59e0b";
  if (status === "Desconectado" || status === "En descanso") return "#94a3b8";
  return "#2BB5C3";
}

export default function DispatchMap({
  clients,
  dispatches,
  locations,
  couriers,
  route,
  selectedCourierId,
  now,
  onSelectCourier,
}: Props) {
  const activeDispatches = useMemo(
    () =>
      dispatches.filter(
        (dispatch) => !["Entregado", "Cancelado"].includes(dispatch.status),
      ),
    [dispatches],
  );
  const points = useMemo(
    () => [
      ...locations
        .map((location) => location.coordinate)
        .filter(isValidCoordinate),
      ...activeDispatches.flatMap((dispatch) =>
        [dispatch.origin.coordinate, dispatch.destination.coordinate].filter(
          isValidCoordinate,
        ),
      ),
      ...(route?.startCoordinate && isValidCoordinate(route.startCoordinate)
        ? [route.startCoordinate]
        : []),
      ...(route?.stops.map((stop) => stop.coordinate) ?? []),
    ],
    [activeDispatches, locations, route],
  );
  const center: [number, number] = points.length
    ? [points[0].latitude, points[0].longitude]
    : [0, 0];

  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.nombre])),
    [clients],
  );

  if (!points.length) {
    return (
      <div className="flex min-h-82.5 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2BB5C3]/10 text-[#2BB5C3]">
            <MapPinned size={22} />
          </div>
          <h3 className="text-sm font-extrabold text-[#1B2B4B]">
            Mapa en espera de coordenadas
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#6B7A99]">
            Las ubicaciones de mensajeros y paradas aparecerán cuando el
            servicio registre coordenadas GPS reales.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-82.5 overflow-hidden rounded-2xl border border-slate-200 sm:h-110">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapToPoints points={points} />
        {route && route.stops.length > 1 && route.startCoordinate && (
          <Polyline
            positions={[
              [route.startCoordinate.latitude, route.startCoordinate.longitude],
              ...route.stops.map(
                (stop) =>
                  [stop.coordinate.latitude, stop.coordinate.longitude] as [
                    number,
                    number,
                  ],
              ),
            ]}
            pathOptions={{ color: "#E8449A", weight: 3, dashArray: "6 8" }}
          />
        )}
        {locations.map((location) => {
          if (!isValidCoordinate(location.coordinate)) return null;
          const courier = couriers.find(
            (item) => item.id === location.courierId,
          );
          if (!courier) return null;
          const activeCount = dispatches.filter(
            (dispatch) =>
              dispatch.courierId === courier.id &&
              !["Entregado", "Cancelado"].includes(dispatch.status),
          ).length;
          const age = now - new Date(location.recordedAt).getTime();
          const status =
            age > 5 * 60 * 1000
              ? "Sin señal reciente"
              : location.availability ?? "Estado no reportado";

          return (
            <CircleMarker
              key={location.courierId}
              center={[
                location.coordinate.latitude,
                location.coordinate.longitude,
              ]}
              radius={selectedCourierId === courier.id ? 12 : 9}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: courierColor(status),
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => onSelectCourier(courier.id),
              }}
            >
              <Popup>
                <strong>{courier.nombre}</strong>
                <br />
                {status} · {activeCount} servicios activos
                <br />
                Actualizado: {new Date(location.recordedAt).toLocaleString("es-CO")}
              </Popup>
            </CircleMarker>
          );
        })}
        {activeDispatches.map((dispatch) => {
          const coordinate = dispatch.origin.coordinate;
          if (!isValidCoordinate(coordinate)) return null;

          return (
            <CircleMarker
              key={`dispatch-${dispatch.id}`}
              center={[coordinate.latitude, coordinate.longitude]}
              radius={7}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor:
                  dispatch.priority === "Urgente"
                    ? "#ef4444"
                    : dispatch.priority === "Prioritaria"
                      ? "#f59e0b"
                      : "#1B2B4B",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <strong>{dispatch.code}</strong>
                <br />
                {dispatch.clientId
                  ? clientsById.get(dispatch.clientId) ?? dispatch.clientName
                  : dispatch.clientName}
                <br />
                {dispatch.origin.address}
              </Popup>
            </CircleMarker>
          );
        })}
        {route?.stops.map((stop) => (
          <CircleMarker
            key={`route-${stop.sequence}`}
            center={[stop.coordinate.latitude, stop.coordinate.longitude]}
            radius={6}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#E8449A",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>Parada {stop.sequence}</strong> · {stop.stopType === "origin" ? "Recogida" : "Entrega"}
              <br />
              {stop.dispatchCode} · {stop.address}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="absolute bottom-3 left-3 z-400 flex flex-wrap gap-2 rounded-xl bg-white/95 px-3 py-2 text-[10px] font-semibold text-slate-600 shadow">
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2BB5C3]" />Disponible</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />En ruta</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#1B2B4B]" />Solicitud</span>
      </div>
    </div>
  );
}
