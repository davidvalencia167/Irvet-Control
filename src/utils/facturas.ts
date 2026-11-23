export interface ServicioFacturable {
  id: string;
  factura: string;
  cliente: string;
  fecha: string;
}

export interface ConflictoFacturas {
  veterinaria: string;
  fecha: string;
  facturas: string[];
  servicioIds: string[];
}

const INITIAL_INVOICE_CONSECUTIVE = 30000;

function normalizeClinicName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase();
}

function nextInvoiceNumber(servicios: readonly ServicioFacturable[]): string {
  // The number is not reserved after its last service is deleted, so that number may be reused.
  const maxExistingNumber = servicios.reduce((max, servicio) => {
    const match = /^FAC-(\d+)$/i.exec(servicio.factura);
    return match ? Math.max(max, Number(match[1])) : max;
  }, INITIAL_INVOICE_CONSECUTIVE);

  return `FAC-${maxExistingNumber + 1}`;
}

export function getOrCreateInvoiceNumber(
  servicios: readonly ServicioFacturable[],
  veterinariaId: string,
  fecha: string,
): string {
  if (!veterinariaId.trim() || !fecha) return "";

  const clinicKey = normalizeClinicName(veterinariaId);
  const existing = servicios.find(
    (servicio) =>
      normalizeClinicName(servicio.cliente) === clinicKey &&
      servicio.fecha === fecha &&
      servicio.factura,
  );

  return existing?.factura ?? nextInvoiceNumber(servicios);
}

export function reassignInvoiceNumber(
  servicios: readonly ServicioFacturable[],
  servicioId: string,
  veterinariaId: string,
  fecha: string,
): string {
  const servicio = servicios.find((item) => item.id === servicioId);
  if (!servicio) {
    throw new Error(`No se encontró el servicio ${servicioId} para reasignar su factura.`);
  }

  return getOrCreateInvoiceNumber(servicios, veterinariaId, fecha);
}

export function findInvoiceConflicts(
  servicios: readonly ServicioFacturable[],
): ConflictoFacturas[] {
  const groups = new Map<string, ServicioFacturable[]>();

  for (const servicio of servicios) {
    if (!servicio.cliente.trim() || !servicio.fecha || !servicio.factura) continue;
    const key = `${normalizeClinicName(servicio.cliente)}|${servicio.fecha}`;
    const group = groups.get(key) ?? [];
    group.push(servicio);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => {
      const invoices = [...new Set(group.map((servicio) => servicio.factura))];
      return invoices.length > 1
        ? {
            veterinaria: group[0].cliente,
            fecha: group[0].fecha,
            facturas: invoices,
            servicioIds: group.map((servicio) => servicio.id),
          }
        : null;
    })
    .filter((conflict): conflict is ConflictoFacturas => conflict !== null);
}
