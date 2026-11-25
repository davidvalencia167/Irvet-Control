import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPinned,
  Navigation,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
  X,
} from "lucide-react";
import type { AuthUser } from "../../api/auth";
import { dispatchApi } from "../../api/dispatch";
import { api } from "../../api/resources";
import type { Cliente, Orden, Responsable } from "../../types";
import type {
  CourierLocation,
  DispatchCreateInput,
  DispatchRoute,
  DispatchRouteStop,
  DispatchRequest,
  DispatchStatus,
} from "../../types/dispatch";
import {
  courierWorkload,
  distanceInKm,
  recommendCouriers,
  summarizeDispatches,
} from "../../utils/dispatch";
import DispatchMap from "./DispatchMap";
import DispatchRequestForm from "./DispatchRequestForm";

type DateRange = "Hoy" | "7 días" | "30 días" | "Todo";

const ACTIVE_STATUSES = new Set<DispatchStatus>([
  "Asignado",
  "Mensajero en camino",
  "Llegó al origen",
  "Muestra recogida",
  "En tránsito",
  "Llegó al destino",
  "Incidencia",
]);

const NEXT_COURIER_STATUS: Partial<Record<DispatchStatus, DispatchStatus>> = {
  Asignado: "Mensajero en camino",
  "Mensajero en camino": "Llegó al origen",
  "Llegó al origen": "Muestra recogida",
  "Muestra recogida": "En tránsito",
  "En tránsito": "Llegó al destino",
  "Llegó al destino": "Entregado",
};

function nextCourierStatus(dispatch: DispatchRequest): DispatchStatus | undefined {
  if (dispatch.status !== "Incidencia") {
    return NEXT_COURIER_STATUS[dispatch.status];
  }
  const previousStatus = [...dispatch.events]
    .reverse()
    .find((event) => event.status !== "Incidencia")?.status;
  return previousStatus ? NEXT_COURIER_STATUS[previousStatus] : undefined;
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Error inesperado.";
}

function isWithinRange(value: string, range: DateRange) {
  if (range === "Todo") return true;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const days = range === "Hoy" ? 1 : range === "7 días" ? 7 : 30;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

function statusStyle(status: DispatchStatus) {
  if (status === "Entregado") return "bg-emerald-50 text-emerald-700";
  if (status === "Incidencia" || status === "Cancelado") return "bg-rose-50 text-rose-700";
  if (ACTIVE_STATUSES.has(status)) return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

function priorityStyle(priority: DispatchRequest["priority"]) {
  if (priority === "Urgente") return "bg-rose-100 text-rose-700";
  if (priority === "Prioritaria") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function timestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Truck;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-[#1B2B4B]">{value}</p>
    </article>
  );
}

function StatusUpdateDialog({
  dispatch,
  nextStatus,
  onClose,
  onSubmit,
  saving,
}: {
  dispatch: DispatchRequest;
  nextStatus: DispatchStatus;
  onClose: () => void;
  onSubmit: (data: { note?: string; recipientName?: string; confirmation?: string }) => void;
  saving: boolean;
}) {
  const [note, setNote] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const isDelivery = nextStatus === "Entregado";
  const isIncident = nextStatus === "Incidencia";

  const submit = () => {
    if (isDelivery && (!recipientName.trim() || !confirmation.trim())) {
      setError("Registre quién recibió y la confirmación de entrega.");
      return;
    }
    if (isIncident && !note.trim()) {
      setError("Describa la incidencia antes de reportarla.");
      return;
    }
    onSubmit({
      note: note.trim() || undefined,
      recipientName: recipientName.trim() || undefined,
      confirmation: confirmation.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-1100 flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="status-dialog-title" className="font-extrabold text-[#1B2B4B]">
              {isIncident ? "Reportar incidencia" : `Confirmar: ${nextStatus}`}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {dispatch.code} · {dispatch.clientName}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">{error}</p>}
        <div className="mt-4 space-y-3">
          {isDelivery && (
            <>
              <label className="block text-xs font-bold text-slate-600">
                Nombre de quien recibe <span className="text-rose-500">*</span>
                <input
                  autoFocus
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2BB5C3]"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Confirmación / soporte <span className="text-rose-500">*</span>
                <input
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="Código, firma registrada o constancia"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2BB5C3]"
                />
              </label>
            </>
          )}
          <label className="block text-xs font-bold text-slate-600">
            Observación{isIncident ? " (requerida)" : ""}
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2BB5C3]"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">
            Volver
          </button>
          <button type="button" onClick={submit} disabled={saving} className="rounded-xl bg-[#2BB5C3] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {saving ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </section>
    </div>
  );
}

interface Props {
  clients: Cliente[];
  orders: Orden[];
  responsables: Responsable[];
  currentUser: AuthUser;
  onOrdersChange?: (orders: Orden[]) => void;
}

export default function Dispatch({
  clients,
  orders,
  responsables,
  currentUser,
  onOrdersChange,
}: Props) {
  const isCourier = currentUser.rol === "Domiciliario multiservicios";
  const currentCourierId = String(currentUser.id);
  const [dispatches, setDispatches] = useState<DispatchRequest[]>([]);
  const [locations, setLocations] = useState<CourierLocation[]>([]);
  const [routes, setRoutes] = useState<DispatchRoute[]>([]);
  const [routeDraft, setRouteDraft] = useState<DispatchRoute | null>(null);
  const [now, setNow] = useState(0);
  const [dispatchError, setDispatchError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gpsSharing, setGpsSharing] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("7 días");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const [chosenCouriers, setChosenCouriers] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<DispatchRequest | undefined>();
  const [statusTarget, setStatusTarget] = useState<{
    dispatch: DispatchRequest;
    status: DispatchStatus;
  } | null>(null);
  const watchId = useRef<number | null>(null);
  const lastLocationSentAt = useRef(0);
  const gpsRequested = useRef(false);

  const loadData = useCallback(async () => {
    const [dispatchResult, locationResult, routeResult] = await Promise.allSettled([
      dispatchApi.list(),
      dispatchApi.locations(),
      dispatchApi.routes(),
    ]);

    if (dispatchResult.status === "fulfilled") {
      setDispatches(dispatchResult.value.dispatches);
      setDispatchError("");
    } else {
      setDispatchError(messageOf(dispatchResult.reason));
    }
    if (locationResult.status === "fulfilled") {
      setLocations(locationResult.value.locations);
      setLocationError("");
    } else {
      setLocationError(messageOf(locationResult.reason));
    }
    if (routeResult.status === "fulfilled") {
      setRoutes(routeResult.value.routes);
      setRouteError("");
    } else {
      setRouteError(messageOf(routeResult.reason));
    }
    setNow(Date.now());
    setLoading(false);
  }, []);
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    let active = true;
    const initialLoadId = window.setTimeout(() => {
      if (active) void loadData();
    }, 0);
    const intervalId = window.setInterval(() => {
      if (active) void refreshData();
    }, 30_000);
    return () => {
      active = false;
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadData, refreshData]);

  useEffect(
    () => () => {
      gpsRequested.current = false;
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    },
    [],
  );

  const couriers = useMemo(
    () =>
      responsables.filter(
        (responsable) =>
          responsable.rol === "Domiciliario multiservicios" &&
          responsable.estado === "Activo",
      ),
    [responsables],
  );
  const routeCourierId = isCourier
    ? currentCourierId
    : selectedCourierId ?? couriers[0]?.id ?? "";
  const displayedRoute =
    routeDraft?.courierId === routeCourierId
      ? routeDraft
      : routes.find((route) => route.courierId === routeCourierId) ?? null;
  const visibleDispatches = useMemo(
    () =>
      isCourier
        ? dispatches.filter((dispatch) => dispatch.courierId === currentCourierId)
        : dispatches,
    [currentCourierId, dispatches, isCourier],
  );
  const filteredDispatches = visibleDispatches.filter((dispatch) => {
    const query = search.trim().toLocaleLowerCase();
    const matchesText =
      !query ||
      [dispatch.code, dispatch.clientName, dispatch.contactName, dispatch.description]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    const matchesStatus = statusFilter === "Todos" || dispatch.status === statusFilter;
    return matchesText && matchesStatus && isWithinRange(dispatch.requestedAt, dateRange);
  });
  const periodDispatches = visibleDispatches.filter((dispatch) =>
    isWithinRange(dispatch.requestedAt, dateRange),
  );
  const stats = summarizeDispatches(periodDispatches);
  const visibleLocations = isCourier
    ? locations.filter((location) => location.courierId === currentCourierId)
    : locations;
  const latestLocation = visibleLocations.find(
    (location) => location.courierId === currentCourierId,
  );

  const saveDispatch = async (data: DispatchCreateInput, id?: string) => {
    setSaving(true);
    setNotice("");
    try {
      if (id) await dispatchApi.update(id, data);
      else await dispatchApi.create(data);
      setShowForm(false);
      setEditingDispatch(undefined);
      setNotice(id ? "Solicitud actualizada." : "Solicitud creada.");
      await loadData();
    } catch (error) {
      setNotice(`No se pudo guardar la solicitud: ${messageOf(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const assignCourier = async (dispatch: DispatchRequest) => {
    const courierId =
      chosenCouriers[dispatch.id] ??
      recommendCouriers(dispatch, couriers, locations, dispatches, now)[0]?.courier.id;
    if (!courierId) {
      setNotice(
        dispatch.origin.coordinate
          ? "No hay mensajeros activos con ubicación GPS válida para recomendar."
          : "La solicitud no tiene coordenadas de origen; agregue coordenadas para recomendar.",
      );
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      await dispatchApi.assign(dispatch.id, courierId);
      setNotice("Asignación guardada.");
      await loadData();
      if (dispatch.orderId && onOrdersChange) {
        try {
          const result = await api.orders();
          onOrdersChange(result.orders);
        } catch (error) {
          setNotice(
            `Asignación guardada, pero no se pudo actualizar la vista de órdenes: ${messageOf(error)}`,
          );
        }
      }
    } catch (error) {
      setNotice(`No se pudo asignar el mensajero: ${messageOf(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const optimizeCourierRoute = async () => {
    if (!routeCourierId) return;
    setSaving(true);
    setRouteError("");
    try {
      const result = await dispatchApi.optimizeRoute(routeCourierId);
      setRouteDraft(result.route);
      setSelectedCourierId(routeCourierId);
      setNotice("Ruta sugerida con distancias geodésicas y prioridad de servicio.");
    } catch (error) {
      setRouteError(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  const saveCourierRoute = async () => {
    if (!displayedRoute) return;
    setSaving(true);
    setRouteError("");
    try {
      const result = await dispatchApi.acceptRoute(
        displayedRoute.courierId,
        displayedRoute.stops,
      );
      setRouteDraft(null);
      setRoutes((current) => [
        result.route,
        ...current.filter((route) => route.courierId !== result.route.courierId),
      ]);
      setNotice("Ruta guardada y vinculada con las solicitudes asignadas.");
      await loadData();
    } catch (error) {
      setRouteError(messageOf(error));
    } finally {
      setSaving(false);
    }
  };

  const moveRouteStop = (index: number, direction: -1 | 1) => {
    const route = routeDraft ?? displayedRoute;
    if (!route) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= route.stops.length) return;
    const stops = [...route.stops];
    [stops[index], stops[targetIndex]] = [stops[targetIndex], stops[index]];
    const orderedStops: DispatchRouteStop[] = stops.map((stop, stopIndex) => ({
      ...stop,
      sequence: stopIndex + 1,
    }));
    const stopPositions = new Map(
      orderedStops.map((stop, stopIndex) => [
        `${stop.dispatchId}|${stop.stopType}`,
        stopIndex,
      ]),
    );
    const violatesCustodyOrder = orderedStops.some(
      (stop) =>
        stop.stopType === "destination" &&
        stopPositions.has(`${stop.dispatchId}|origin`) &&
        stopPositions.get(`${stop.dispatchId}|origin`)! >=
          stopPositions.get(`${stop.dispatchId}|destination`)!,
    );
    if (violatesCustodyOrder) {
      setNotice("La recogida de una muestra debe preceder a su entrega.");
      return;
    }
    const distanceKm = route.startCoordinate
      ? orderedStops.reduce(
          (distance, stop, stopIndex) =>
            distance +
            distanceInKm(
              stopIndex === 0
                ? route.startCoordinate!
                : orderedStops[stopIndex - 1].coordinate,
              stop.coordinate,
            ),
          0,
        )
      : route.distanceKm;
    setRouteDraft({
      ...route,
      status: "Sugerida",
      distanceKm,
      stops: orderedStops,
    });
  };

  const cancelDispatch = async (dispatch: DispatchRequest) => {
    if (!window.confirm(`¿Cancelar la solicitud ${dispatch.code}?`)) return;
    setSaving(true);
    setNotice("");
    try {
      await dispatchApi.cancel(dispatch.id);
      setNotice("Solicitud cancelada.");
      await loadData();
    } catch (error) {
      setNotice(`No se pudo cancelar: ${messageOf(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (details: {
    note?: string;
    recipientName?: string;
    confirmation?: string;
  }) => {
    if (!statusTarget) return;
    setSaving(true);
    setNotice("");
    try {
      await dispatchApi.updateStatus(
        statusTarget.dispatch.id,
        statusTarget.status,
        details,
      );
      setNotice(
        statusTarget.status === "Entregado"
          ? "Entrega registrada con confirmación."
          : "Seguimiento actualizado.",
      );
      setStatusTarget(null);
      await loadData();
    } catch (error) {
      setNotice(`No se pudo actualizar el seguimiento: ${messageOf(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const startGps = () => {
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("Este dispositivo no ofrece geolocalización.");
      return;
    }
    gpsRequested.current = true;
    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 20_000,
    };
    const sendLocation = (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastLocationSentAt.current < 30_000) return;
      lastLocationSentAt.current = now;
      void dispatchApi
        .updateLocation({
          courierId: currentCourierId,
          coordinate: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          accuracyMeters: position.coords.accuracy,
        })
        .then(() => setGpsError(""))
        .catch((error: unknown) => setGpsError(messageOf(error)));
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!gpsRequested.current) return;
        void dispatchApi
          .updateLocation({
            courierId: currentCourierId,
            coordinate: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            accuracyMeters: position.coords.accuracy,
          })
          .then(async () => {
            if (!gpsRequested.current) return;
            await dispatchApi.setAvailability("Disponible");
            if (!gpsRequested.current) return;
            lastLocationSentAt.current = Date.now();
            setGpsSharing(true);
            watchId.current = navigator.geolocation.watchPosition(
              sendLocation,
              (error) => {
                gpsRequested.current = false;
                setGpsError(error.message || "No se pudo obtener la ubicación GPS.");
                setGpsSharing(false);
                if (watchId.current !== null) {
                  navigator.geolocation.clearWatch(watchId.current);
                  watchId.current = null;
                }
              },
              options,
            );
          })
          .catch((error: unknown) => {
            gpsRequested.current = false;
            setGpsError(messageOf(error));
          });
      },
      (error) => {
        gpsRequested.current = false;
        setGpsError(error.message || "No se pudo obtener la ubicación GPS.");
      },
      options,
    );
  };

  const stopGps = async () => {
    gpsRequested.current = false;
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setGpsSharing(false);
    try {
      await dispatchApi.setAvailability("En descanso");
      setNotice("Jornada pausada; se detuvo el envío de ubicación.");
    } catch (error) {
      setGpsError(`Ubicación detenida, pero no se pudo actualizar disponibilidad: ${messageOf(error)}`);
    }
  };

  const startStatusUpdate = (dispatch: DispatchRequest, status: DispatchStatus) =>
    setStatusTarget({ dispatch, status });

  const events = visibleDispatches
    .flatMap((dispatch) =>
      dispatch.events.map((event) => ({ ...event, dispatchCode: dispatch.code })),
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )
    .slice(0, 6);

  const completionsByCourier = couriers.map((courier) => ({
    courier,
    completed: periodDispatches.filter(
      (dispatch) =>
        dispatch.courierId === courier.id && dispatch.status === "Entregado",
    ).length,
  }));
  const maxCompletions = Math.max(1, ...completionsByCourier.map((item) => item.completed));

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl bg-[#1B2B4B] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-[#77e3eb]">
            <MapPinned size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">
              Operaciones logísticas
            </span>
          </div>
          <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
            Centro de Despachos IA
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/65 sm:text-sm">
            Seguimiento de solicitudes, mensajeros y cadena de custodia de muestras.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refreshData()}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </button>
          {!isCourier && (
            <button
              type="button"
              onClick={() => {
                setEditingDispatch(undefined);
                setShowForm(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#2BB5C3] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-black/10 hover:bg-[#27a5b2]"
            >
              <Plus size={15} />
              Nueva solicitud
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div role="status" aria-live="polite" className="flex items-start justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={16} /></button>
        </div>
      )}
      {dispatchError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-extrabold">No se pudieron cargar las solicitudes de despacho.</p>
          <p className="mt-1 wrap-break-word">{dispatchError}</p>
          <p className="mt-2 text-xs">Verifique que el endpoint dispatches.php esté instalado y disponible.</p>
        </div>
      )}
      {locationError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          No se pudieron cargar las ubicaciones GPS: {locationError}
        </div>
      )}
      {routeError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          No se pudo cargar o guardar la ruta: {routeError}
        </div>
      )}

      {isCourier && (
        <section className="rounded-2xl border border-[#2BB5C3]/25 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2BB5C3]/10 text-[#2BB5C3]">
              <Navigation size={19} />
            </span>
            <div>
              <h2 className="font-extrabold text-[#1B2B4B]">Jornada y ubicación</h2>
              <p className="mt-1 text-xs text-slate-500">
                {gpsSharing
                  ? `Compartiendo GPS · última posición ${timestamp(latestLocation?.recordedAt)}`
                  : "La ubicación solo se comparte mientras la jornada esté activa."}
              </p>
              {gpsError && <p role="alert" className="mt-1 text-xs text-rose-700">{gpsError}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void (gpsSharing ? stopGps() : startGps())}
            className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white sm:mt-0 sm:w-auto ${gpsSharing ? "bg-slate-600" : "bg-[#2BB5C3]"}`}
          >
            {gpsSharing ? "Pausar jornada" : "Iniciar jornada y compartir GPS"}
          </button>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard icon={Truck} label="Solicitudes" value={stats.total} tone="bg-slate-100 text-slate-600" />
        <StatCard icon={Clock3} label="Pendientes" value={stats.pending} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Navigation} label="En ruta" value={stats.onRoute} tone="bg-sky-50 text-sky-600" />
        <StatCard icon={PackageCheck} label="Entregadas" value={stats.completed} tone="bg-emerald-50 text-emerald-600" />
        <StatCard icon={AlertTriangle} label="Incidencias" value={stats.incidents} tone="bg-rose-50 text-rose-600" />
      </section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
        <section className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[#1B2B4B]">Centro de control en vivo</h2>
              <p className="mt-1 text-xs text-slate-500">Mapa OpenStreetMap · solo coordenadas recibidas del sistema</p>
            </div>
            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-500">
              {visibleLocations.length} ubicaciones GPS
            </span>
          </div>
          <DispatchMap
            clients={clients}
            dispatches={visibleDispatches}
            locations={visibleLocations}
            couriers={couriers}
            route={displayedRoute}
            selectedCourierId={selectedCourierId}
            now={now}
            onSelectCourier={setSelectedCourierId}
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {couriers
              .filter((courier) => !isCourier || courier.id === currentCourierId)
              .map((courier) => {
                const location = visibleLocations.find((item) => item.courierId === courier.id);
                const workload = courierWorkload(courier.id, visibleDispatches);
                const hasRecentLocation =
                  location &&
                  now - new Date(location.recordedAt).getTime() <= 5 * 60_000;
                return (
                  <button
                    type="button"
                    key={courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedCourierId === courier.id ? "border-[#2BB5C3] bg-[#2BB5C3]/5" : "border-slate-100 hover:bg-slate-50"}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B2B4B] text-xs font-extrabold text-white">
                      {courier.nombre.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-extrabold text-[#1B2B4B]">{courier.nombre}</span>
                      <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                        {location
                          ? `${hasRecentLocation ? location.availability ?? "Estado no reportado" : "Sin señal reciente"} · ${timestamp(location.recordedAt)}`
                          : "Sin ubicación GPS"}
                      </span>
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{workload} activos</span>
                  </button>
                );
              })}
            {!couriers.length && (
              <p className="col-span-full rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                No hay usuarios activos con rol Domiciliario multiservicios.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#1B2B4B]">Seguimiento reciente</h2>
              <p className="mt-1 text-xs text-slate-500">Eventos confirmados por la API</p>
            </div>
            <Bell size={17} className="text-[#2BB5C3]" />
          </div>
          {events.length ? (
            <ol className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2BB5C3]/10 text-[#2BB5C3]">
                    <Activity size={13} />
                  </span>
                  <div className="min-w-0 flex-1 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-xs font-extrabold text-[#1B2B4B]">{event.status}</p>
                      <time className="text-[10px] text-slate-400">{timestamp(event.createdAt)}</time>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {event.dispatchCode} · {event.createdBy}
                    </p>
                    {event.recipientName && (
                      <p className="mt-1 text-[11px] text-slate-600">
                        Recibió: {event.recipientName}
                      </p>
                    )}
                    {event.confirmation && (
                      <p className="mt-1 text-[11px] text-slate-600">
                        Confirmación: {event.confirmation}
                      </p>
                    )}
                    {event.note && <p className="mt-1 wrap-break-word text-[11px] text-slate-600">{event.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-500">
              Aún no hay eventos de seguimiento.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1B2B4B]">Optimización de rutas</h2>
            <p className="mt-1 text-xs text-slate-500">
              Orden de recogidas y entregas por coordenadas, prioridad y precedencia de muestras.
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Heurística geodésica en línea recta; no representa vías, tráfico ni tiempos de conducción.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isCourier && (
              <select
                aria-label="Mensajero para optimizar ruta"
                value={routeCourierId}
                onChange={(event) => setSelectedCourierId(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"
              >
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>{courier.nombre}</option>
                ))}
              </select>
            )}
            {!isCourier && (
              <button
                type="button"
                disabled={saving || !routeCourierId}
                onClick={() => void optimizeCourierRoute()}
                className="rounded-xl bg-[#1B2B4B] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                Calcular sugerencia
              </button>
            )}
            {!isCourier && routeDraft?.courierId === routeCourierId && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveCourierRoute()}
                className="rounded-xl bg-[#2BB5C3] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
              >
                Aceptar ruta
              </button>
            )}
          </div>
        </div>
        {displayedRoute ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-xl bg-[#F4F7FA] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {displayedRoute.status === "Sugerida" ? "Borrador de ruta" : "Ruta activa"}
              </p>
              <p className="mt-1 text-sm font-extrabold text-[#1B2B4B]">{displayedRoute.courierName}</p>
              <p className="mt-2 text-2xl font-extrabold text-[#2BB5C3]">
                {displayedRoute.distanceKm.toLocaleString("es-CO", { maximumFractionDigits: 2 })} km
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Distancia recta aproximada</p>
              <p className="mt-3 text-xs font-semibold text-slate-600">{displayedRoute.stops.length} paradas</p>
            </div>
            <ol className="space-y-2">
              {displayedRoute.stops.map((stop, index) => (
                <li key={`${stop.dispatchId}-${stop.stopType}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8449A]/10 text-[10px] font-extrabold text-[#b92d78]">
                    {stop.sequence}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-[#1B2B4B]">
                      {stop.stopType === "origin" ? "Recoger" : "Entregar"} · {stop.dispatchCode}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">{stop.address}</p>
                    {stop.dispatchStatus && (
                      <p className="mt-0.5 text-[9px] text-slate-400">Estado: {stop.dispatchStatus}</p>
                    )}
                  </div>
                  {!isCourier && (
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        aria-label={`Subir parada ${stop.sequence}`}
                        disabled={index === 0}
                        onClick={() => moveRouteStop(index, -1)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Bajar parada ${stop.sequence}`}
                        disabled={index === displayedRoute.stops.length - 1}
                        onClick={() => moveRouteStop(index, 1)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
            {isCourier
              ? "No hay una ruta activa asignada."
              : couriers.length
                ? "Seleccione un mensajero con GPS reciente y servicios con coordenadas de origen y destino."
                : "No hay mensajeros activos para planificar rutas."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1B2B4B]">
              {isCourier ? "Mis servicios" : "Solicitudes de despacho"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isCourier ? "Solo servicios asignados a tu usuario." : "Asignaciones, prioridades y cadena de custodia."}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="relative">
              <span className="sr-only">Buscar solicitudes</span>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar clínica o código"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#2BB5C3]"
              />
            </label>
            <select
              aria-label="Filtrar por estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-[#2BB5C3]"
            >
              <option>Todos</option>
              {[
                "Pendiente",
                "Por asignar",
                "Asignado",
                "Mensajero en camino",
                "Llegó al origen",
                "Muestra recogida",
                "En tránsito",
                "Llegó al destino",
                "Entregado",
                "Incidencia",
                "Cancelado",
              ].map((status) => <option key={status}>{status}</option>)}
            </select>
            <select
              aria-label="Filtrar por fecha"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as DateRange)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 outline-none focus:border-[#2BB5C3]"
            >
              {(["Hoy", "7 días", "30 días", "Todo"] as const).map((range) => <option key={range}>{range}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Cargando despachos…</div>
        ) : filteredDispatches.length ? (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {filteredDispatches.map((dispatch) => {
              const recommendations = isCourier
                ? []
                : recommendCouriers(dispatch, couriers, locations, dispatches, now);
              const selectedRecommendation = recommendations[0];
              const selectedAssignment =
                chosenCouriers[dispatch.id] ?? selectedRecommendation?.courier.id ?? "";
              const nextStatus = isCourier ? nextCourierStatus(dispatch) : undefined;
              const canAssign = ["Pendiente", "Por asignar", "Asignado"].includes(dispatch.status);
              const canCancel = !["Entregado", "Cancelado"].includes(dispatch.status);

              return (
                <article key={dispatch.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#1B2B4B]">{dispatch.code}</span>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${statusStyle(dispatch.status)}`}>{dispatch.status}</span>
                        <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${priorityStyle(dispatch.priority)}`}>{dispatch.priority}</span>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-extrabold text-[#1B2B4B]">{dispatch.clientName}</h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {dispatch.serviceType} · {dispatch.orderId ? `Orden ${orders.find((order) => order.id === dispatch.orderId)?.numeroOrden || dispatch.orderId}` : "Sin orden vinculada"}
                      </p>
                    </div>
                    {!isCourier && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setEditingDispatch(dispatch);
                          setShowForm(true);
                        }}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 sm:grid-cols-2">
                    <p><span className="font-bold text-slate-500">Origen:</span> {dispatch.origin.address}</p>
                    <p><span className="font-bold text-slate-500">Destino:</span> {dispatch.destination.address}</p>
                    <p><span className="font-bold text-slate-500">Contacto:</span> {dispatch.contactName || "No registrado"} {dispatch.contactPhone && `· ${dispatch.contactPhone}`}</p>
                    <p><span className="font-bold text-slate-500">Mensajero:</span> {dispatch.courierName || "Por asignar"}</p>
                  </div>

                  {!isCourier && canAssign && (
                    <div className="mt-3 rounded-xl border border-[#2BB5C3]/20 bg-[#2BB5C3]/5 p-3">
                      {selectedRecommendation ? (
                        <div className="mb-2 flex items-start gap-2">
                          <span className="mt-0.5 text-[#2BB5C3]"><Users size={15} /></span>
                          <div>
                            <p className="text-[11px] font-extrabold text-[#1B2B4B]">
                              Recomendación por distancia y carga: {selectedRecommendation.courier.nombre}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
                              {selectedRecommendation.reason} Distancia geodésica; no calcula rutas viales ni ETA.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mb-2 text-[10px] text-slate-600">
                          {dispatch.origin.coordinate
                            ? "Faltan ubicaciones GPS válidas para recomendar."
                            : "Agregue coordenadas reales del origen para calcular recomendaciones."}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label={`Mensajero para ${dispatch.code}`}
                          value={selectedAssignment}
                          onChange={(event) =>
                            setChosenCouriers((current) => ({
                              ...current,
                              [dispatch.id]: event.target.value,
                            }))
                          }
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"
                        >
                          <option value="">Seleccionar mensajero manualmente</option>
                          {couriers.map((courier) => (
                            <option key={courier.id} value={courier.id}>
                              {courier.nombre}
                              {recommendations.find((item) => item.courier.id === courier.id)
                                ? ` · ${recommendations.find((item) => item.courier.id === courier.id)?.distanceKm.toFixed(1)} km`
                                : " · sin ubicación"}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={saving || !selectedAssignment}
                          onClick={() => void assignCourier(dispatch)}
                          className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1B2B4B] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          Asignar <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {isCourier && dispatch.status === "Llegó al destino" && (
                    <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[10px] font-semibold text-amber-800">
                      Para completar la entrega debes registrar el nombre de quien recibe y su confirmación.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-[10px] text-slate-400">Solicitado {timestamp(dispatch.requestedAt)}</span>
                    <div className="flex flex-wrap gap-2">
                      {nextStatus && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => startStatusUpdate(dispatch, nextStatus)}
                          className="rounded-lg bg-[#2BB5C3] px-3 py-2 text-[10px] font-extrabold text-white disabled:opacity-50"
                        >
                          {nextStatus === "Entregado" ? "Confirmar entrega" : nextStatus}
                        </button>
                      )}
                      {isCourier && ACTIVE_STATUSES.has(dispatch.status) && dispatch.status !== "Llegó al destino" && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => startStatusUpdate(dispatch, "Incidencia")}
                          className="rounded-lg border border-rose-200 px-3 py-2 text-[10px] font-bold text-rose-700"
                        >
                          Reportar incidencia
                        </button>
                      )}
                      {!isCourier && canCancel && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void cancelDispatch(dispatch)}
                          className="rounded-lg border border-rose-100 px-3 py-2 text-[10px] font-bold text-rose-600 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <PackageCheck size={24} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-[#1B2B4B]">
              {visibleDispatches.length ? "No hay resultados para esos filtros" : "No hay solicitudes de despacho"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isCourier ? "Los servicios asignados aparecerán aquí." : "Cree una solicitud para empezar a coordinar un servicio."}
            </p>
          </div>
        )}
      </section>

      {!isCourier && (
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B2B4B]">Entregas por mensajero</h2>
                <p className="mt-1 text-[10px] text-slate-500">Conteo según despachos con estado Entregado.</p>
              </div>
              <CheckCircle2 size={17} className="text-emerald-500" />
            </div>
            {completionsByCourier.length ? (
              <div className="space-y-3">
                {completionsByCourier.map(({ courier, completed }) => (
                  <div key={courier.id} className="grid grid-cols-[90px_1fr_25px] items-center gap-2">
                    <span className="truncate text-[10px] font-semibold text-slate-600">{courier.nombre}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#2BB5C3]" style={{ width: `${(completed / maxCompletions) * 100}%` }} />
                    </div>
                    <span className="text-right text-[10px] font-extrabold text-[#1B2B4B]">{completed}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No hay mensajeros activos.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#1B2B4B]">Resumen del periodo</h2>
                <p className="mt-1 text-[10px] text-slate-500">Basado en los registros reales disponibles.</p>
              </div>
              <select
                aria-label="Periodo de estadísticas"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value as DateRange)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px]"
              >
                {(["Hoy", "7 días", "30 días", "Todo"] as const).map((range) => <option key={range}>{range}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <p className="rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500">Mensajeros activos<strong className="mt-1 block text-lg text-[#1B2B4B]">{couriers.filter((courier) => locations.some((location) => location.courierId === courier.id && Date.now() - new Date(location.recordedAt).getTime() < 5 * 60_000)).length}</strong></p>
              <p className="rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500">Con coordenadas<strong className="mt-1 block text-lg text-[#1B2B4B]">{visibleLocations.length}</strong></p>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-400">
              No se estiman kilómetros ni tiempos históricos mientras el servidor no registre trazas y marcas de tiempo verificables.
            </p>
          </div>
        </section>
      )}

      {showForm && (
        <DispatchRequestForm
          clients={clients}
          orders={orders}
          initial={editingDispatch}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditingDispatch(undefined);
          }}
          onSubmit={saveDispatch}
        />
      )}
      {statusTarget && (
        <StatusUpdateDialog
          dispatch={statusTarget.dispatch}
          nextStatus={statusTarget.status}
          saving={saving}
          onClose={() => setStatusTarget(null)}
          onSubmit={(details) => void updateStatus(details)}
        />
      )}
    </div>
  );
}
