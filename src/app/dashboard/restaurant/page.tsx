"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChefHat,
  TrendingUp,
  Bell,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Restaurant, Order, MenuItem } from "@/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import {
  formatCurrency,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "orders" | "menu" | "stats" | "settings";

const ORDER_STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
};

export default function RestaurantDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuthStore();

  const [tab, setTab] = useState<Tab>("orders");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    preparation_time: "15",
  });
  const [savingItem, setSavingItem] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role !== "restaurant_owner" && profile.role !== "admin") {
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
      // Get restaurant
      const { data: rest } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (!rest) {
        setLoading(false);
        return;
      }
      setRestaurant(rest as Restaurant);

      // Get pending/active orders
      const { data: ords } = await supabase
        .from("orders")
        .select("*, customer:profiles(full_name, phone)")
        .eq("restaurant_id", rest.id)
        .not("status", "in", "(delivered,cancelled)")
        .order("created_at", { ascending: true });
      setOrders((ords as Order[]) || []);

      // Get menu items
      const { data: items } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", rest.id)
        .order("name");
      setMenuItems((items as MenuItem[]) || []);
    } finally {
      setLoading(false);
    }
  };

  // Real-time order subscription
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("restaurant-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          loadData();
          toast.success("🔔 Nuevo pedido recibido!");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => loadData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant]);

  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const nextStatus = ORDER_STATUS_FLOW[currentStatus];
    if (!nextStatus) return;

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(`Pedido marcado como: ${getOrderStatusLabel(nextStatus as any)}`);
      loadData();
    }
  };

  const toggleRestaurantOpen = async () => {
    if (!restaurant) return;
    const { error } = await supabase
      .from("restaurants")
      .update({ is_open: !restaurant.is_open })
      .eq("id", restaurant.id);

    if (!error) {
      setRestaurant({ ...restaurant, is_open: !restaurant.is_open });
      toast.success(restaurant.is_open ? "Restaurante cerrado" : "Restaurante abierto");
    }
  };

  const toggleItemAvailable = async (item: MenuItem) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);

    if (!error) {
      setMenuItems(menuItems.map((i) =>
        i.id === item.id ? { ...i, is_available: !i.is_available } : i
      ));
    }
  };

  const addMenuItem = async () => {
    if (!restaurant || !newItem.name.trim() || !newItem.price) {
      toast.error("Nombre y precio son requeridos");
      return;
    }
    setSavingItem(true);
    const { error } = await supabase.from("menu_items").insert({
      restaurant_id: restaurant.id,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
      preparation_time: parseInt(newItem.preparation_time),
      is_available: true,
    });

    if (error) {
      toast.error("Error al agregar item");
    } else {
      toast.success("Item agregado al menú");
      setAddItemModal(false);
      setNewItem({ name: "", description: "", price: "", preparation_time: "15" });
      loadData();
    }
    setSavingItem(false);
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!confirm("¿Eliminar este item del menú?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
    if (!error) {
      setMenuItems(menuItems.filter((i) => i.id !== itemId));
      toast.success("Item eliminado");
    }
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "orders", label: "Pedidos", icon: "📦" },
    { key: "menu", label: "Menú", icon: "🍽️" },
    { key: "stats", label: "Estadísticas", icon: "📊" },
    { key: "settings", label: "Config", icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="font-bold text-gray-700 text-xl">Sin restaurante</h2>
        <p className="text-gray-400 text-sm mt-2">
          Crea tu restaurante para empezar
        </p>
        <Button className="mt-4" onClick={() => router.push("/dashboard/restaurant/create")}>
          Crear Restaurante
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="font-black text-2xl text-gray-900">{restaurant.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Panel de control</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRestaurantOpen}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              restaurant.is_open
                ? "bg-pinol-100 text-pinol-700 hover:bg-pinol-200"
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {restaurant.is_open ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            {restaurant.is_open ? "Abierto" : "Cerrado"}
          </button>
        </div>
      </div>

      {/* Pending orders badge */}
      {orders.filter((o) => o.status === "pending").length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-red-600 animate-bounce-subtle" />
          </div>
          <div>
            <p className="font-bold text-red-800">
              {orders.filter((o) => o.status === "pending").length} pedidos esperando confirmación
            </p>
            <p className="text-sm text-red-600">¡Confirma para no perder clientes!</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? "bg-white text-pinol-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay pedidos activos</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">#{order.order_number}</p>
                      <Badge variant={
                        order.status === "pending" ? "yellow" :
                        order.status === "confirmed" ? "blue" :
                        order.status === "preparing" ? "orange" :
                        order.status === "ready" ? "blue" : "gray"
                      } size="sm">
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Cliente: {(order as any).customer?.full_name || "Desconocido"}
                    </p>
                    {(order as any).customer?.phone && (
                      <a
                        href={`tel:${(order as any).customer.phone}`}
                        className="text-xs text-pinol-600 hover:underline"
                      >
                        📞 {(order as any).customer.phone}
                      </a>
                    )}
                  </div>
                  <span className="font-black text-pinol-700 text-lg">
                    {formatCurrency(order.total)}
                  </span>
                </div>

                {/* Items */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-gray-500">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      📝 {order.notes}
                    </p>
                  )}
                </div>

                {/* Address */}
                <p className="text-xs text-gray-500 mb-3">
                  📍 {order.delivery_address.street}
                  {order.delivery_address.reference && ` · ${order.delivery_address.reference}`}
                </p>

                {/* Action button */}
                {ORDER_STATUS_FLOW[order.status] && (
                  <Button
                    onClick={() => updateOrderStatus(order.id, order.status)}
                    fullWidth
                    size="sm"
                    className="mt-2"
                  >
                    {order.status === "pending" && "✅ Confirmar Pedido"}
                    {order.status === "confirmed" && "👨‍🍳 Empezar a Preparar"}
                    {order.status === "preparing" && "📦 Marcar como Listo"}
                  </Button>
                )}

                {order.status === "ready" && (
                  <div className="mt-2 bg-pinol-50 rounded-xl p-3 text-center">
                    <p className="text-sm font-semibold text-pinol-700">
                      🛵 Esperando repartidor...
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Menu tab */}
      {tab === "menu" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              Menú ({menuItems.length} items)
            </h2>
            <Button
              size="sm"
              onClick={() => setAddItemModal(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${item.is_available ? "text-gray-900" : "text-gray-400"}`}>
                      {item.name}
                    </p>
                    {!item.is_available && (
                      <Badge variant="red" size="sm">No disponible</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-pinol-700 mt-0.5">
                    {formatCurrency(item.price)}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleItemAvailable(item)}
                    className={`p-2 rounded-xl transition-colors ${
                      item.is_available
                        ? "text-pinol-600 hover:bg-pinol-50"
                        : "text-gray-400 hover:bg-gray-50"
                    }`}
                    title={item.is_available ? "Deshabilitar" : "Habilitar"}
                  >
                    {item.is_available ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {menuItems.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Sin items en el menú</p>
                <Button size="sm" className="mt-3" onClick={() => setAddItemModal(true)}>
                  Agregar primer item
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats tab */}
      {tab === "stats" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Rating</p>
            <p className="text-3xl font-black text-pinol-700 mt-1">
              ⭐ {restaurant.rating.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{restaurant.total_reviews} reseñas</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Items en menú</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{menuItems.length}</p>
            <p className="text-xs text-gray-400 mt-1">
              {menuItems.filter(i => i.is_available).length} disponibles
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2">
            <p className="text-sm text-gray-500">Estado del restaurante</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-3 h-3 rounded-full ${restaurant.is_open ? "bg-pinol-500" : "bg-red-400"}`} />
              <p className="font-bold text-gray-900">
                {restaurant.is_open ? "Abierto para pedidos" : "Cerrado temporalmente"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Información del Restaurante</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Nombre</p>
              <p className="font-medium text-gray-900">{restaurant.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Dirección</p>
              <p className="font-medium text-gray-900">{restaurant.address}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Teléfono</p>
              <p className="font-medium text-gray-900">{restaurant.phone || "No configurado"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Envío</p>
              <p className="font-medium text-gray-900">{formatCurrency(restaurant.delivery_fee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Tiempo de entrega</p>
              <p className="font-medium text-gray-900">
                {restaurant.delivery_time_min}-{restaurant.delivery_time_max} min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      <Modal
        isOpen={addItemModal}
        onClose={() => setAddItemModal(false)}
        title="Agregar al Menú"
      >
        <div className="space-y-4">
          <Input
            label="Nombre del plato *"
            placeholder="Ej: Baho, Gallo Pinto..."
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <Input
            label="Descripción"
            placeholder="Descripción del plato"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
          <Input
            label="Precio (C$) *"
            type="number"
            placeholder="0.00"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <Input
            label="Tiempo de preparación (min)"
            type="number"
            value={newItem.preparation_time}
            onChange={(e) =>
              setNewItem({ ...newItem, preparation_time: e.target.value })
            }
          />
          <Button onClick={addMenuItem} loading={savingItem} fullWidth size="lg">
            Agregar al Menú
          </Button>
        </div>
      </Modal>
    </div>
  );
}
