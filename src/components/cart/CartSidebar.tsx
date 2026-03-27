"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const {
    items,
    restaurant_name,
    delivery_fee,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Mi Pedido</h2>
            {restaurant_name && (
              <p className="text-sm text-gray-500">{restaurant_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Tu carrito está vacío</p>
                <p className="text-sm text-gray-400 mt-1">
                  Agrega productos para comenzar
                </p>
              </div>
              <Link
                href="/"
                onClick={onClose}
                className="bg-pinol-600 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold hover:bg-pinol-700 transition-colors"
              >
                Ver Restaurantes
              </Link>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-gray-50 rounded-2xl"
                >
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
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
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm font-bold text-pinol-700 mt-0.5">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-pinol-50 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold text-gray-800 min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-pinol-600 flex items-center justify-center text-white hover:bg-pinol-700 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
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

              <button
                onClick={clearCart}
                className="w-full text-sm text-red-500 hover:text-red-700 flex items-center justify-center gap-2 py-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Vaciar carrito
              </button>
            </>
          )}
        </div>

        {/* Footer with totals */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Envío</span>
                <span className="font-medium text-pinol-600">
                  {delivery_fee > 0 ? formatCurrency(delivery_fee) : "Gratis"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span className="text-pinol-700">{formatCurrency(total)}</span>
              </div>
            </div>

            <Link href="/cart" onClick={onClose}>
              <button className="w-full bg-pinol-600 text-white py-3.5 rounded-2xl font-bold text-base hover:bg-pinol-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98">
                Ver Pedido
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
