import {
  Clock,
  CheckCheck,
  CookingPot,
  CircleCheckBig,
  HandPlatter,
  CircleX,
  CircleAlert,
  CircleCheck,
  Ban,
  BanknoteArrowUp,
} from 'lucide-angular';

export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SERVED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  
export type UiTone =
  | 'neutral'
  | 'warning'
  | 'info'
  | 'primary'
  | 'success'
  | 'danger'
  | 'muted';

export type StatusUi = {
  label: string;
  tone: UiTone;
  icon?: any;
};

export function toneToTextClass(tone: UiTone) {
  return {
    neutral: 'text-gray-700',
    muted: 'text-gray-500',
    warning: 'text-amber-600',
    info: 'text-sky-600',
    primary: 'text-blue-600',
    success: 'text-green-600',
    danger: 'text-red-600',
  }[tone];
}

export function toneToBadgeClass(tone: UiTone) {
  return {
    neutral: 'badge-ghost',
    muted: 'badge-ghost',
    warning: 'badge-warning',
    info: 'badge-info',
    primary: 'badge-primary',
    success: 'badge-success',
    danger: 'badge-error',
  }[tone];
}

export function getOrderStatusUi(status: string): StatusUi {
  return (ORDER_STATUS_UI as Record<string, StatusUi>)[status] ?? {
    label: status,
    tone: 'neutral',
  };
}

export function getPaymentStatusUi(status: string): StatusUi {
  return (PAYMENT_STATUS_UI as Record<string, StatusUi>)[status] ?? {
    label: status,
    tone: 'neutral',
  };
}

export const ORDER_STATUS_UI: Record<OrderStatus, StatusUi> = {
  PENDING: { label: 'Pendiente', tone: 'warning', icon: Clock },
  APPROVED: { label: 'Confirmado', tone: 'info', icon: CheckCheck },
  IN_PROGRESS: { label: 'En preparación', tone: 'primary', icon: CookingPot },
  COMPLETED: { label: 'Listo', tone: 'success', icon: CircleCheckBig },
  SERVED: { label: 'Entregado', tone: 'neutral', icon: HandPlatter },
  CANCELLED: { label: 'Cancelado', tone: 'danger', icon: CircleX },
};

export const PAYMENT_STATUS_UI: Record<PaymentStatus, StatusUi> = {
  PENDING: { label: 'Pendiente', tone: 'warning', icon: CircleAlert },
  COMPLETED: { label: 'Pagado', tone: 'success', icon: CircleCheck },
  FAILED: { label: 'Falló', tone: 'danger', icon: Ban },
  CANCELLED: { label: 'Cancelado', tone: 'muted', icon: CircleX },
};

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'MOBILE_PAYMENT'
  | 'OTHER';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta de crédito',
  DEBIT_CARD: 'Débito',
  MOBILE_PAYMENT: 'Mercado Pago',
  OTHER: 'Otro',
};
