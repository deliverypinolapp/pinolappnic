"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle, Circle, Phone, MapPin, Clock } from "lucide-react";
import { Order, OrderStatus, OrderStatusHistory } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getOrderStatusLabel, formatRelativeTime } from "@/lib/utils";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "delivered",
];

const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: "🕐",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "📦",
  picked_up: "🛵",
  delivered: "🎉",
  cancelled: "❌",
};

interface OrderTrackerProps {
  orderId: string;
  initialOrder: Order;
}

export default function OrderTracker({ orderId, initialOrder }: OrderTrackerProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Load status history
    const loadHistory = async () => {
      const { data } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      setHistory((data as OrderStatusHistory[]) || []);
    };
    loadHistory();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        async (payload) => {
          const updatedOrder = payload.new as Order;
          setOrder((prev) => ({ ...prev, ...updatedOrder }));

          // Reload history
          const { data } = await supabase
            .from("order_status_history")
            .select("*")
            .eq("order_id", orderId)
            .order("created_at", { ascending: true });
          setHistory((data as OrderStatusHistory[]) || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div
        className={`p-5 rounded-2xl ${
          isCancelled
            ? "bg-red-50 border border-red-200"
            : order.status === "delivered"
            ? "bg-pinol-50 border border-pinol-200"
            : "bg-gradient-to-r from-pinol-600 to-pinol-700 text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{STATUS_ICONS[order.status]}</span>
          <div>
            <h3
              className={`font-bold text-lg ${
                isCancelled
                  ? "text-red-800"
                  : order.status === "delivered"
                  ? "text-pinol-800"
                  : "text-white"
              }`}
            >
              {getOrderStatusLabel(order.status)}
            </h3>
            <p
              className={`text-sm ${
                isCancelled
                  ? "text-red-600"
                  : order.status === "delivered"
                  ? "text-pinol-600"
                  : "text-pinol-100"
              }`}
            >
              {order.status === "delivered" &&
                "¡Tu pedido fue entregado con éxito!"}
              {order.status === "picked_up" &&
                `Tu pedido está en camino y llegará pronto a tu domicilio. #${order.order_number}`}
              {order.status === "preparing" &&
                "El restaurante está preparando tu pedido"}
              {order.status === "confirmed" &&
                "El restaurante confirmó tu pedido"}
              {order.status === "pending" &&
                "Esperando confirmación del restaurante"}
              {order.status === "ready" &&
                "Tu pedido está listo, el repartidor viene en camino"}
              {order.status === "cancelled" &&
                `Pedido cancelado: ${order.cancellation_reason || "Sin motivo especificado"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-5">Estado del Pedido</h4>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div
              className="absolute left-4 top-0 w-0.5 bg-pinol-500 transition-all duration-700"
              style={{
                height: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />

            <div className="space-y-6">
              {STATUS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                const historyItem = history.find((h) => h.status === step);

                return (
                  <div key={step} className="flex items-center gap-4 relative z-10">
                    {/* Step circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                        isCompleted
                          ? "bg-pinol-600 shadow-md"
                          : "bg-white border-2 border-gray-200"
                      } ${isCurrent ? "ring-4 ring-pinol-100 shadow-lg" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-300" />
                      )}
                    </div>

                    {/* Step info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isCompleted ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {STATUS_ICONS[step]} {getOrderStatusLabel(step)}
                        </span>
                        {historyItem && (
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(historyItem.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Driver info */}
      {order.driver && (order.status === "picked_up" || order.status === "ready") && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-4">Tu Repartidor</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pinol-400 to-pinol-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                🛵
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {order.driver.profile?.full_name || "Repartidor"}
                </p>
                <p className="text-sm text-gray-500">
                  ⭐ {order.driver.rating.toFixed(1)} · {order.driver.total_deliveries} entregas
                </p>
                <p className="text-xs text-gray-400">
                  {order.driver.vehicle_type === "motorcycle"
                    ? "🏍️ Moto"
                    : order.driver.vehicle_type === "bicycle"
                    ? "🚲 Bicicleta"
                    : "🚗 Carro"}{" "}
                  · {order.driver.license_plate}
                </p>
              </div>
            </div>
            {order.driver.profile?.phone && (
              <a
                href={`tel:${order.driver.profile.phone}`}
                className="w-12 h-12 bg-pinol-600 text-white rounded-2xl flex items-center justify-center shadow-md hover:bg-pinol-700 transition-colors active:scale-95"
              >
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Delivery address */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-pinol-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-pinol-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Dirección de entrega</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {order.delivery_address.street}
            </p>
            {order.delivery_address.reference && (
              <p className="text-xs text-gray-400 mt-0.5">
                Ref: {order.delivery_address.reference}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
