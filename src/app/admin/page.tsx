"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Store,
  Package,
  Truck,
  TrendingUp,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Restaurant, Order, Profile } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuthStore();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingRestaurants: 0,
  });
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "restaurants" | "orders" | "users">("overview");

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== "admin") {
      toast.error("Acceso denegado - Solo administradores");
      router.push("/");
      return;
    }
    loadData();
  }, [user, profile]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Stats
      const [usersResult, restaurantsResult, ordersResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("restaurants").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      const { count: pendingRest } = await supabase
        .from("restaurants")
        .select("*", { count: "exact", head: true })
        .eq("is_active", false);

      setStats({
        totalUsers: usersResult.count || 0,
        totalRestaurants: restaurantsResult.count || 0,
        totalOrders: ordersResult.data?.length || 0,
        totalRevenue,
        pendingRestaurants: pendingRest || 0,
      });

      // Restaurants
      const { data: rests } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setRestaurants((rests as Restaurant[]) || []);

      // Recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*, restaurant:restaurants(name), customer:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      setRecentOrders((orders as Order[]) || []);
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurantActive = async (rest: Restaurant) => {
    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: !rest.is_active })
      .eq("id", rest.id);

    if (!error) {
      setRestaurants(restaurants.map((r) =>
        r.id === rest.id ? { ...r, is_active: !r.is_active } : r
      ));
      toast.success(rest.is_active ? "Restaurante desactivado" : "Restaurante activado");
    }
  };

  const TABS = [
    { key: "overview", label: "Resumen", icon: "📊" },
    { key: "restaurants", label: "Restaurantes", icon: "🍽️" },
    { key: "orders", label: "Pedidos", icon: "📦" },
  ] as const;

  const StatCard = ({
    label,
    value,
    icon,
    color,
  }: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
  }) => (
    <div className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
          Live
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-gray-900">Administración</h1>
            <p className="text-sm text-gray-500">Panel de control PinolApp</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Usuarios"
              value={stats.totalUsers}
              icon="👤"
              color="bg-blue-100 text-blue-700"
            />
            <StatCard
              label="Restaurantes"
              value={stats.totalRestaurants}
              icon="🍽️"
              color="bg-orange-100 text-orange-700"
            />
            <StatCard
              label="Pedidos"
              value={stats.totalOrders}
              icon="📦"
              color="bg-pinol-100 text-pinol-700"
            />
            <StatCard
              label="Ingresos"
              value={formatCurrency(stats.totalRevenue)}
              icon="💰"
              color="bg-yellow-100 text-yellow-700"
            />
          </div>

          {stats.pendingRestaurants > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-yellow-800">
                  {stats.pendingRestaurants} restaurantes pendientes de activación
                </p>
                <button
                  onClick={() => setTab("restaurants")}
                  className="text-sm text-yellow-700 underline mt-0.5"
                >
                  Ver restaurantes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restaurants */}
      {tab === "restaurants" && (
        <div className="space-y-3">
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 truncate">{rest.name}</p>
                    <Badge variant={rest.is_active ? "green" : "red"} size="sm">
                      {rest.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    <Badge variant={rest.is_open ? "green" : "yellow"} size="sm">
                      {rest.is_open ? "Abierto" : "Cerrado"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{rest.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ⭐ {rest.rating} · {rest.total_reviews} reseñas
                  </p>
                </div>
                <button
                  onClick={() => toggleRestaurantActive(rest)}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                    rest.is_active
                      ? "text-red-500 hover:bg-red-50"
                      : "text-pinol-600 hover:bg-pinol-50"
                  }`}
                >
                  {rest.is_active ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {tab === "orders" && (
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">
                      #{order.order_number}
                    </p>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "green"
                          : order.status === "cancelled"
                          ? "red"
                          : order.status === "pending"
                          ? "yellow"
                          : "blue"
                      }
                      size="sm"
                    >
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {(order as any).restaurant?.name} ·{" "}
                    {(order as any).customer?.full_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className="font-black text-pinol-700 text-sm flex-shrink-0">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
