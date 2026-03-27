"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Phone, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";
import OrderTracker from "@/components/order/OrderTracker";
import Modal from "@/components/ui/Modal";
import StarRating from "@/components/ui/StarRating";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthStore();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(*),
          driver:drivers(*, profile:profiles(*))
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Pedido no encontrado");
        router.push("/orders");
        return;
      }
      setOrder(data as Order);

      // Check if already reviewed
      const { data: review } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", id)
        .single();
      setHasReviewed(!!review);
      setLoading(false);
    };

    loadOrder();
  }, [id]);

  const submitReview = async () => {
    if (!order || !user) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        order_id: order.id,
        customer_id: user.id,
        restaurant_id: order.restaurant_id,
        driver_id: order.driver_id,
        restaurant_rating: restaurantRating,
        driver_rating: order.driver_id ? driverRating : null,
        comment: comment.trim(),
      });

      if (error) {
        toast.error("Error al enviar reseña");
        return;
      }

      setHasReviewed(true);
      setReviewModal(false);
      toast.success("¡Gracias por tu reseña! ⭐");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!["pending", "confirmed"].includes(order.status)) {
      toast.error("No puedes cancelar este pedido en su estado actual");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "Cancelado por el cliente",
      })
      .eq("id", order.id);

    if (error) {
      toast.error("Error al cancelar pedido");
    } else {
      toast.success("Pedido cancelado");
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : prev);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-4">
        <div className="h-8 bg-gray-200 rounded-xl animate-pulse w-32 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-black text-xl text-gray-900">Pedido en camino</h1>
          <p className="text-sm text-gray-500">#{order.order_number}</p>
        </div>
      </div>

      {/* Order tracker */}
      <OrderTracker orderId={order.id} initialOrder={order} />

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-pinol-600" />
          <h3 className="font-bold text-gray-900">
            {(order as any).restaurant?.name}
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.quantity}x {item.name}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Envío</span>
            <span className="text-pinol-600">{formatCurrency(order.delivery_fee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Descuento</span>
              <span className="text-green-600">-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-black border-t border-gray-200 pt-2">
            <span>Total</span>
            <span className="text-pinol-700">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-3">
        {order.status === "delivered" && !hasReviewed && (
          <Button
            onClick={() => setReviewModal(true)}
            fullWidth
            variant="secondary"
            size="lg"
            className="flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Calificar Pedido
          </Button>
        )}

        {["pending", "confirmed"].includes(order.status) && (
          <button
            onClick={handleCancelOrder}
            className="w-full py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition-colors border border-red-200"
          >
            Cancelar Pedido
          </button>
        )}

        <p className="text-center text-xs text-gray-400">
          Pedido realizado el {formatDate(order.created_at)}
        </p>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModal}
        onClose={() => setReviewModal(false)}
        title="Califica tu Pedido"
      >
        <div className="space-y-5">
          <div>
            <p className="font-semibold text-gray-900 mb-2">
              🍽️ {(order as any).restaurant?.name}
            </p>
            <StarRating
              rating={restaurantRating}
              interactive
              onRate={setRestaurantRating}
              size="lg"
            />
          </div>

          {order.driver_id && (
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                🛵 Califica al repartidor
              </p>
              <StarRating
                rating={driverRating}
                interactive
                onRate={setDriverRating}
                size="lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Comentario (opcional)
            </label>
            <textarea
              placeholder="¿Cómo fue tu experiencia?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pinol-500 resize-none"
            />
          </div>

          <Button
            onClick={submitReview}
            loading={submittingReview}
            fullWidth
            size="lg"
          >
            Enviar Reseña ⭐
          </Button>
        </div>
      </Modal>
    </div>
  );
}
