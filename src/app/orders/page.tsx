"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ChevronRight,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";
import { useAuthStore } from "@/store/authStore";
import {
  formatCurrency,
  formatDate,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

export default function OrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurant:restaurants(name, logo_url)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar pedidos");
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    // Real-time subscription
    if (!user) return;
    const channel = supabase
      .channel("orders-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `customer_id=eq.${user.id}`,
        },
        () => loadOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const activeOrders = orders.filter(
    (o) =>
      !["delivered", "cancelled"].includes(o.status)
  );
  const pastOrders = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status)
  );

  const StatusBadge = ({ status }: { status: Order["status"] }) => {
    const colorMap: Record<string, string> = {
      pending: "yellow",
      confirmed: "blue",
      preparing: "orange",
      ready: "blue",
      picked_up: "green",
      delivered: "green",
      cancelled: "red",
    };
    return (
      <Badge variant={(colorMap[status] as any) || "gray"}>
        {getOrderStatusLabel(status)}
      </Badge>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Link href={`/orders/${order.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 active:scale-99">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">
                #{order.order_number}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {(order as any).restaurant?.name || "Restaurante"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-black text-pinol-700">
              {formatCurrency(order.total)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Items preview */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-500">
            {order.items
              .slice(0, 2)
              .map((item) => `${item.quantity}x ${item.name}`)
              .join(", ")}
            {order.items.length > 2 && ` +${order.items.length - 2} más`}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-black text-xl text-gray-900">Mis Pedidos</h1>
        </div>
        <button
          onClick={loadOrders}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 mt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="font-bold text-gray-700 text-lg">
            No tienes pedidos aún
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Haz tu primer pedido ahora
          </p>
          <Link href="/">
            <button className="mt-4 bg-pinol-600 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold hover:bg-pinol-700 transition-colors">
              Explorar Restaurantes
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Active orders */}
          {activeOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-pinol-500 rounded-full animate-pulse" />
                En Curso ({activeOrders.length})
              </h2>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}

          {/* Past orders */}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-900 mb-3">
                Historial ({pastOrders.length})
              </h2>
              <div className="space-y-3">
                {pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
