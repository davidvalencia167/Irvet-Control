import { request } from "./resources";
import type {
  CourierLocation,
  CourierAvailability,
  DispatchRoute,
  DispatchRouteStop,
  DispatchCreateInput,
  DispatchRequest,
  DispatchStatusDetails,
  DispatchStatus,
} from "../types/dispatch";

export const dispatchApi = {
  async list() {
    return request<{ dispatches: DispatchRequest[] }>("/dispatches.php");
  },

  async create(dispatch: DispatchCreateInput) {
    return request<{ dispatch: DispatchRequest }>("/dispatches.php", {
      method: "POST",
      body: JSON.stringify(dispatch),
    });
  },

  async update(id: string, dispatch: DispatchCreateInput) {
    return request<{ dispatch: DispatchRequest }>("/dispatches.php", {
      method: "PUT",
      body: JSON.stringify({ ...dispatch, id }),
    });
  },

  async assign(id: string, courierId: string) {
    return request<{ dispatch: DispatchRequest }>("/dispatches.php", {
      method: "PATCH",
      body: JSON.stringify({ id, action: "assign", courierId }),
    });
  },

  async updateStatus(
    id: string,
    status: DispatchStatus,
    details: DispatchStatusDetails = {},
  ) {
    return request<{ dispatch: DispatchRequest }>("/dispatches.php", {
      method: "PATCH",
      body: JSON.stringify({ id, action: "status", status, ...details }),
    });
  },

  async cancel(id: string) {
    return request<{ dispatch: DispatchRequest }>("/dispatches.php", {
      method: "PATCH",
      body: JSON.stringify({ id, action: "cancel" }),
    });
  },

  async locations() {
    return request<{ locations: CourierLocation[] }>("/courier-locations.php");
  },

  async routes() {
    return request<{ routes: DispatchRoute[] }>("/routes.php");
  },

  async optimizeRoute(courierId: string) {
    return request<{ route: DispatchRoute }>("/routes.php", {
      method: "POST",
      body: JSON.stringify({ action: "optimize", courierId }),
    });
  },

  async acceptRoute(courierId: string, stops: DispatchRouteStop[]) {
    return request<{ route: DispatchRoute }>("/routes.php", {
      method: "POST",
      body: JSON.stringify({
        action: "accept",
        courierId,
        stops: stops.map(({ dispatchId, stopType, sequence }) => ({
          dispatchId,
          stopType,
          sequence,
        })),
      }),
    });
  },

  async updateLocation(location: Omit<CourierLocation, "recordedAt">) {
    return request<{ location: CourierLocation }>("/courier-locations.php", {
      method: "POST",
      body: JSON.stringify(location),
    });
  },

  async setAvailability(availability: CourierAvailability) {
    return request("/courier-locations.php", {
      method: "PATCH",
      body: JSON.stringify({ action: "availability", availability }),
    });
  },
};
