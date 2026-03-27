"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  MapPin,
  ShoppingCart,
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
  { key: "cash", label: "Efectivo", icon: Banknote, desc: "Pago al recibir" },
  { key: "card", label: "Tarjeta", icon: CreditCard, desc: "Visa / Mastercard" },
  { key: "transfer", label: "Transferencia", icon: Smartphone, desc: "Transfermóvil" },
] as const;

export default function CartPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuthStore();
  const {
    items,
    restaurant_name,
    restaurant_id,
    delivery_fee,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const [street, setStreet] = useState(profile?.address || "");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [loading, setLoading] = useState(false);

  const subtotal = getSubtotal();
  const total = subtotal + delivery_fee;

  const handleOrder = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para hacer un pedido");
      router.push("/auth/login");
      return;
    }

    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (!street.trim()) {
      toast.error("Ingresa tu dirección de entrega");
      return;
    }

    if (!restaurant_id) {
      toast.error("Error con el restaurante");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customer_id: user.id,
        restaurant_id: restaurant_id,
        status: "pending",
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url || "",
        })),
        subtotal: subtotal,
        delivery_fee: delivery_fee,
        discount: 0,
        total: total,
        delivery_address: {
          street: street,
          city: "Managua",
          neighborhood: "",
          reference: reference,
          lat: profile?.address_lat || 12.1328,
          lng: profile?.address_lng || -86.2504,
        },
        payment_method: paymentMethod,
        payment_status: "pending",
        notes: notes,
        order_number: "",
      };

      const { data: order, error } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error("Error al crear el pedido");
        return;
      }

      // Insert initial status history
      await supabase.from("order_status_history").insert({
        order_id: order.id,
        status: "pending",
        notes: "Pedido creado",
        created_by: user.id,
      });

      // Send notification to restaurant owner
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("owner_id, name")
        .eq("id", restaurant_id)
        .single();

      if (restaurant) {
        await supabase.from("notifications").insert({
          user_id: restaurant.owner_id,
          title: "Nuevo Pedido 🔔",
          body: `Nuevo pedido #${order.order_number} por ${formatCurrency(total)}`,
          type: "order_update",
          data: { order_id: order.id },
        });
      }

      clearCart();
      toast.success("¡Pedido realizado con éxito! 🎉");
      router.push(`/orders/${order.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-700">Tu carrito está vacío</h2>
        <p className="text-gray-400 text-sm mt-2">
          Agrega productos de algún restaurante
        </p>
        <Button
          onClick={() => router.push("/")}
          className="mt-6"
          size="lg"
        >
          Explorar Restaurantes
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Mi Pedido</h1>
          {restaurant_name && (
            <p className="text-sm text-gray-500">{restaurant_name}</p>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Items</h2>
          <button
            onClick={clearCart}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 p-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    🍽️
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {item.name}
                </p>
                <p className="text-sm font-bold text-pinol-700 mt-0.5">
                  {formatCurrency(item.price * item.quantity)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-gray-900 min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-pinol-600 flex items-center justify-center text-white hover:bg-pinol-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-5 h-5 text-pinol-600" />
          <h2 className="font-bold text-gray-900">Dirección de entrega</h2>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="Calle, barrio, número de casa..."
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            error={!street.trim() ? undefined : undefined}
          />
          <Input
            placeholder="Referencia (ej: casa azul, frente al parque)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Método de pago</h2>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.key}
                onClick={() => setPaymentMethod(method.key)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  paymentMethod === method.key
                    ? "border-pinol-500 bg-pinol-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    paymentMethod === method.key
                      ? "text-pinol-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    paymentMethod === method.key
                      ? "text-pinol-700"
                      : "text-gray-600"
                  }`}
                >
                  {method.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Notas (opcional)</h2>
        <textarea
          placeholder="Instrucciones especiales, alergias..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pinol-500 focus:bg-white resize-none transition-all"
        />
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-900 mb-3">Resumen</h2>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.length} items)</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span className="font-medium text-pinol-600">
              {delivery_fee > 0 ? formatCurrency(delivery_fee) : "Gratis"}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2.5 flex justify-between">
            <span className="font-black text-gray-900">Total</span>
            <span className="font-black text-pinol-700 text-lg">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Place order button (sticky) */}
      <div className="fixed bottom-6 left-0 right-0 max-w-xl mx-auto px-4 z-30">
        <Button
          onClick={handleOrder}
          loading={loading}
          fullWidth
          size="xl"
          className="shadow-2xl"
        >
          Confirmar Pedido · {formatCurrency(total)}
        </Button>
      </div>
    </div>
  );
}
