import type { CourierExpense, Orden, PaymentRow } from "../types";

export interface PaymentSummary {
  total: number;
  received: number;
  promotions: number;
  gifts: number;
  discounts: number;
  covered: number;
  pending: number;
  status: "Pagado" | "Pago parcial" | "Pendiente por pago";
  byMethod: Record<string, number>;
  expenses: number;
  net: number;
}

export interface CourierCollection {
  domiciliario: string;
  services: number;
  received: number;
  expenses: number;
  net: number;
}

const amount = (value: string | number | undefined) => Number(value || 0);

export function calculatePaymentSummary(
  totalValue: string | number,
  payments: PaymentRow[],
  expenses: CourierExpense[] = [],
): PaymentSummary {
  const total = amount(totalValue);
  const received = payments.filter((payment) => (payment.tipo ?? "Pago") === "Pago")
    .reduce((sum, payment) => sum + amount(payment.valor), 0);
  const promotions = payments.filter((payment) => payment.tipo === "Promoción")
    .reduce((sum, payment) => sum + amount(payment.valor), 0);
  const gifts = payments.filter((payment) => payment.tipo === "Obsequio")
    .reduce((sum, payment) => sum + amount(payment.valor), 0);
  const discounts = payments.filter((payment) => payment.tipo === "Descuento")
    .reduce((sum, payment) => sum + amount(payment.valor), 0);
  const byMethod = payments
    .filter((payment) => (payment.tipo ?? "Pago") === "Pago" && payment.medio)
    .reduce<Record<string, number>>((methods, payment) => {
      methods[payment.medio] = (methods[payment.medio] ?? 0) + amount(payment.valor);
      return methods;
    }, {});
  const covered = received + promotions + gifts + discounts;
  const expensesTotal = expenses.filter((expense) => expense.autorizado)
    .reduce((sum, expense) => sum + amount(expense.valor), 0);

  return {
    total,
    received,
    promotions,
    gifts,
    discounts,
    covered,
    pending: Math.max(0, total - covered),
    status: total > 0 && covered >= total ? "Pagado" : covered > 0 ? "Pago parcial" : "Pendiente por pago",
    byMethod,
    expenses: expensesTotal,
    net: received - expensesTotal,
  };
}

export function summarizeByCourier(orders: Orden[]): CourierCollection[] {
  const grouped = new Map<string, CourierCollection>();
  orders.forEach((order) => {
    const domiciliario = order.domiciliario || "Sin domiciliario asignado";
    const summary = calculatePaymentSummary(order.valorTotal, order.pagos, order.gastosDomiciliario);
    const current = grouped.get(domiciliario) ?? { domiciliario, services: 0, received: 0, expenses: 0, net: 0 };
    current.services += summary.total;
    current.received += summary.received;
    current.expenses += summary.expenses;
    current.net += summary.net;
    grouped.set(domiciliario, current);
  });
  return [...grouped.values()].sort((a, b) => a.domiciliario.localeCompare(b.domiciliario));
}
