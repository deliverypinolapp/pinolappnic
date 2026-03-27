"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { MenuItem, Restaurant } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface MenuItemCardProps {
  item: MenuItem;
  restaurant: Restaurant;
}

export default function MenuItemCard({ item, restaurant }: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(0);
  const { addItem, items, restaurant_id } = useCartStore();

  const cartItem = items.find((i) => i.id === item.id);
  const cartQuantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (restaurant_id && restaurant_id !== restaurant.id) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-sm">¿Limpiar carrito?</p>
            <p className="text-xs text-gray-600">
              Tienes items de otro restaurante. ¿Quieres empezar un nuevo pedido?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  addItem(
                    {
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      quantity: 1,
                      image_url: item.image_url,
                      restaurant_id: item.restaurant_id,
                    },
                    restaurant.name
                  );
                  toast.dismiss(t.id);
                  toast.success(`${item.name} agregado`);
                }}
                className="flex-1 bg-pinol-600 text-white text-xs py-1.5 rounded-lg font-semibold"
              >
                Sí, limpiar
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 bg-gray-100 text-gray-700 text-xs py-1.5 rounded-lg font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
      return;
    }

    addItem(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url,
        restaurant_id: item.restaurant_id,
      },
      restaurant.name
    );
    toast.success(`${item.name} agregado al carrito`, {
      icon: "🛒",
      duration: 1500,
    });
  };

  if (!item.is_available) {
    return (
      <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl opacity-60">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
          {item.image_url && (
            <Image src={item.image_url} alt={item.name} fill className="object-cover grayscale" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-500 text-sm">{item.name}</h4>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
          <span className="text-xs text-red-500 font-medium mt-2 block">No disponible</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Item image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-orange-100 to-orange-200">
            🍽️
          </div>
        )}
        {item.is_featured && (
          <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-lg">
            ⭐
          </div>
        )}
      </div>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-pinol-700">
              {formatCurrency(item.price)}
            </span>
            {item.original_price && item.original_price > item.price && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(item.original_price)}
              </span>
            )}
          </div>

          {/* Quantity control */}
          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2 bg-pinol-50 rounded-xl p-1">
              <button
                onClick={() => {
                  const newQty = cartQuantity - 1;
                  if (newQty <= 0) {
                    useCartStore.getState().removeItem(item.id);
                  } else {
                    useCartStore.getState().updateQuantity(item.id, newQty);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-pinol-600 hover:bg-pinol-600 hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold text-pinol-700 min-w-[16px] text-center">
                {cartQuantity}
              </span>
              <button
                onClick={handleAdd}
                className="w-7 h-7 rounded-lg bg-pinol-600 flex items-center justify-center text-white hover:bg-pinol-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-xl bg-pinol-600 flex items-center justify-center text-white shadow-md hover:bg-pinol-700 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
