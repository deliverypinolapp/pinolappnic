"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Star, Truck, Store } from "lucide-react";
import { Restaurant } from "@/types";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: "horizontal" | "vertical";
}

export default function RestaurantCard({
  restaurant,
  variant = "vertical",
}: RestaurantCardProps) {
  if (variant === "horizontal") {
    return (
      <Link href={`/restaurants/${restaurant.id}`}>
        <div className="flex gap-3 p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 active:scale-98">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
            {restaurant.logo_url ? (
              <Image
                src={restaurant.logo_url}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pinol-100 to-pinol-200">
                <Store className="w-8 h-8 text-pinol-500" />
              </div>
            )}
            {!restaurant.is_open && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Cerrado</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{restaurant.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-gray-700">{restaurant.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({restaurant.total_reviews})</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-pinol-600 font-medium">
                <Truck className="w-3 h-3" />
                <span>{formatCurrency(restaurant.delivery_fee)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden group active:scale-98">
        {/* Cover image */}
        <div className="relative h-40 bg-gray-100">
          {restaurant.cover_url ? (
            <Image
              src={restaurant.cover_url}
              alt={restaurant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pinol-100 via-pinol-200 to-pinol-300 flex items-center justify-center">
              <Store className="w-16 h-16 text-pinol-400" />
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="gray" size="sm">{getCategoryLabel(restaurant.category)}</Badge>
          </div>

          {!restaurant.is_open && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                Cerrado ahora
              </span>
            </div>
          )}

          {/* Logo */}
          <div className="absolute -bottom-5 left-4">
            <div className="w-12 h-12 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden">
              {restaurant.logo_url ? (
                <Image
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pinol-500 to-pinol-600">
                  <Store className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 pt-7">
          <h3 className="font-bold text-gray-900 truncate">{restaurant.name}</h3>
          {restaurant.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{restaurant.description}</p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-800">{restaurant.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({restaurant.total_reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              Mínimo: {formatCurrency(restaurant.min_order)}
            </span>
            <div className="flex items-center gap-1 bg-pinol-50 px-2 py-0.5 rounded-full">
              <Truck className="w-3 h-3 text-pinol-600" />
              <span className="text-xs font-semibold text-pinol-700">
                {formatCurrency(restaurant.delivery_fee)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
