"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  ToggleRight,
  ToggleLeft,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Order, Driver } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, getOrderStatusLabel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DriverDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuthStore();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== "driver" && profile.role !== "admin") {
      toast.error("Acceso denegado");
      router.push("/");
      return;
    }
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get driver profile
      const { data: driverData } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!driverData) {
        // Create driver profile if doesn't exist
        const { data: newDriver } = await supabase
          .from("drivers")
          .insert({ user_id: user.id })
          .select()
          .single();
        setDriver(newDriver as Driver);
      } else {
        setDriver(driverData as Driver);
      }

      // Get available orders (ready for pickup)
      const { data: readyOrders } = await supabase
        .from("orders")
        .select("*, restaurant:restaurants(name, address, phone, lat, lng)")
        .eq("status", "ready")
        .is("driver_id", null);

      // Get my assigned orders
      const { data: myOrders } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(name, address, phone),
          customer:profiles(full_name, phone)
        `)
        .eq("driver_id", driverData?.id || "")
        .not("status", "in", "(delivered,cancelled)");

      const allOrders = [
        ...((myOrders || []) as Order[]),
        ...((readyOrders || []) as Order[]).filter(
          (o) => !myOrders?.some((m: any) => m.id === o.id)
        ),
      ];

      setOrders(allOrders);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("driver-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driver]);

  const toggleOnline = async () => {
    if (!driver) return;
    const { error } = await supabase
      .from("drivers")
      .update({
        is_online: !driver.is_online,
        is_available: !driver.is_online,
      })
      .eq("id", driver.id);

    if (!error) {
      setDriver({ ...driver, is_online: !driver.is_online });
      toast.success(driver.is_online ? "Desconectado" : "En línea 🟢");
    }
  };

  const acceptOrder = async (order: Order) => {
    if (!driver) return;
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: driver.id, status: "picked_up" })
      .eq("id", order.id);

    if (error) {
      toast.error("No se pudo tomar el pedido");
    } else {
      toast.success("¡Pedido aceptado! En camino 🛵");
      loadData();
    }
  };

  const completeDelivery = async (order: Order) => {
    if (!driver) return;
    const { error } = await supabase
      .from("orders")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (!error) {
      // Update driver stats
      await supabase
        .from("drivers")
        .update({
          total_deliveries: (driver.total_deliveries || 0) + 1,
          total_earnings: (driver.total_earnings || 0) + order.delivery_fee,
          is_available: true,
        })
        .eq("id", driver.id);

      toast.success("¡Entrega completada! 🎉");
      loadData();
    }
  };

  const myActiveOrder = orders.find((o) => o.driver_id === driver?.id);
  const availableOrders = orders.filter((o) => !o.driver_id);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="font-black text-2xl text-gray-900">
            Hola, {profile?.full_name?.split(" ")[0]} 🛵
          </h1>
          <p className="text-sm text-gray-500">Panel de Repartidor</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              driver?.is_online
                ? "bg-pinol-100 text-pinol-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {driver?.is_online ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            {driver?.is_online ? "En línea" : "Desconectado"}
          </button>
        </div>
      </div>

      {/* Stats */}
      {driver && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-2xl font-black text-pinol-700">{driver.total_deliveries}</p>
            <p className="text-xs text-gray-500 mt-0.5">Entregas</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-xl font-black text-yellow-600">⭐ {driver.rating.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Rating</p>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
            <p className="text-sm font-black text-gray-700">
              {formatCurrency(driver.total_earnings)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Ganancias</p>
          </div>
        </div>
      )}

      {/* Active order */}
      {myActiveOrder && (
        <div className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-pinol-500 rounded-full animate-pulse" />
            Pedido Activo
          </h2>
          <div className="bg-white rounded-2xl border border-pinol-200 shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">#{myActiveOrder.order_number}</p>
                <p className="text-sm text-pinol-600 font-medium mt-0.5">
                  {(myActiveOrder as any).restaurant?.name}
                </p>
              </div>
              <span className="font-black text-pinol-700">
                {formatCurrency(myActiveOrder.delivery_fee)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-pinol-500 flex-shrink-0" />
                <span className="text-xs">{myActiveOrder.delivery_address.street}</span>
              </div>
              {myActiveOrder.delivery_address.reference && (
                <p className="text-xs text-gray-400 ml-6">
                  Ref: {myActiveOrder.delivery_address.reference}
                </p>
              )}
            </div>

            {/* Customer info */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {(myActiveOrder as any).customer?.full_name || "Cliente"}
                </p>
                <p className="text-xs text-gray-500">Cliente</p>
              </div>
              {(myActiveOrder as any).customer?.phone && (
                <a
                  href={`tel:${(myActiveOrder as any).customer.phone}`}
                  className="w-10 h-10 bg-pinol-600 text-white rounded-xl flex items-center justify-center shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Navigate button */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${myActiveOrder.delivery_address.lat},${myActiveOrder.delivery_address.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold"
              >
                <Navigation className="w-4 h-4" />
                Navegar
              </a>
              <Button
                onClick={() => completeDelivery(myActiveOrder)}
                size="sm"
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Entregado
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Available orders */}
      {!myActiveOrder && (
        <div>
          <h2 className="font-bold text-gray-900 mb-3">
            Pedidos Disponibles ({availableOrders.length})
          </h2>
          {availableOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {driver?.is_online
                  ? "No hay pedidos disponibles ahora"
                  : "Conéctate para ver pedidos"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {(order as any).restaurant?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        📍 {(order as any).restaurant?.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-pinol-700">
                        {formatCurrency(order.delivery_fee)}
                      </p>
                      <p className="text-xs text-gray-400">por entrega</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p className="font-medium">Entregar en:</p>
                    <p className="text-xs text-gray-500">{order.delivery_address.street}</p>
                  </div>
                  <Button
                    onClick={() => acceptOrder(order)}
                    fullWidth
                    size="sm"
                    disabled={!driver?.is_online}
                  >
                    {driver?.is_online ? "🛵 Aceptar Pedido" : "Conéctate primero"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
