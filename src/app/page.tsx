"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  Utensils,
  Zap,
  Pill,
  ShoppingBasket,
  ArrowRight,
  Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Restaurant, RestaurantCategory } from "@/types";
import RestaurantCard from "@/components/restaurant/RestaurantCard";
import { useAuthStore } from "@/store/authStore";
import { getCategoryLabel } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = [
  { key: "restaurant" as RestaurantCategory, label: "Restaurantes", icon: Utensils, color: "from-orange-400 to-red-500" },
  { key: "fast_food" as RestaurantCategory, label: "Rápido", icon: Zap, color: "from-yellow-400 to-orange-500" },
  { key: "pharmacy" as RestaurantCategory, label: "Farmacias", icon: Pill, color: "from-green-400 to-emerald-600" },
  { key: "market" as RestaurantCategory, label: "Mercados", icon: ShoppingBasket, color: "from-teal-400 to-cyan-600" },
];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filtered, setFiltered] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RestaurantCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  const supabase = createClient();
  const { user, profile } = useAuthStore();

  // Show splash for non-authenticated users
  useEffect(() => {
    if (!user) {
      setShowSplash(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (error) {
        toast.error("Error al cargar restaurantes");
        console.error(error);
      } else {
        setRestaurants(data as Restaurant[]);
        setFiltered(data as Restaurant[]);
      }
      setLoading(false);
    };

    fetchRestaurants();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = restaurants;

    if (search.trim()) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeCategory) {
      result = result.filter((r) => r.category === activeCategory);
    }

    setFiltered(result);
  }, [search, activeCategory, restaurants]);

  // SPLASH SCREEN para usuarios no autenticados
  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pinol-900 via-pinol-700 to-pinol-500 relative overflow-hidden flex flex-col items-center justify-between pb-16 pt-20">
        {/* Background bokeh lights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-400/20 blur-3xl animate-pulse"
              style={{
                width: `${80 + i * 30}px`,
                height: `${80 + i * 30}px`,
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-6 z-10">
          <div className="w-28 h-28 bg-red-600 rounded-3xl shadow-2xl flex items-center justify-center relative">
            <div className="text-5xl">🛍️</div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-sm font-bold text-red-800">
              NI
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-black text-white tracking-tight">
              Pinol<span className="text-yellow-400">App</span>
            </h1>
            <p className="text-pinol-100 mt-2 text-base font-medium">
              Delivery 100% Nicaragüense
            </p>
          </div>
        </div>

        {/* City lights illustration */}
        <div className="z-10 text-center px-6">
          <p className="text-pinol-100 text-sm max-w-xs mx-auto leading-relaxed">
            Restaurantes, farmacias y mercados llegando directo a tu puerta 🚀
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="z-10 w-full max-w-sm px-6 space-y-3">
          <Link href="/auth/register">
            <button
              onClick={() => setShowSplash(false)}
              className="w-full bg-pinol-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 hover:bg-pinol-400 transition-all active:scale-95"
            >
              Comienza a pedir
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <button
            onClick={() => setShowSplash(false)}
            className="w-full text-white/80 py-2 text-sm font-medium hover:text-white transition-colors"
          >
            <Link href="/auth/login">Iniciar sesión</Link>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
      {/* Welcome header */}
      <div className="pt-6 pb-2">
        {user && profile ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {profile.full_name.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-500 mt-0.5">¿Qué te gustaría pedir hoy?</p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido 👋
            </h1>
            <p className="text-gray-500 mt-0.5">¿Qué te gustaría pedir hoy?</p>
          </div>
        )}

        {profile?.address && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-pinol-700">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{profile.address}</span>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mt-4 mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar en PinolApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pinol-500 focus:border-pinol-500 shadow-sm"
        />
      </div>

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-pinol-600 to-pinol-800 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20">
          <div className="text-8xl absolute -right-4 -top-2">🛵</div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-yellow-300" />
          <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wide">Oferta Especial</span>
        </div>
        <h3 className="font-bold text-lg">Primer Envío Gratis</h3>
        <p className="text-pinol-100 text-sm mt-0.5">En tu primer pedido del día</p>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">Categorías</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() =>
                  setActiveCategory(isActive ? null : cat.key)
                }
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  isActive
                    ? "bg-pinol-600 text-white shadow-lg scale-105"
                    : "bg-white border border-gray-100 text-gray-700 shadow-sm hover:shadow-md"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive
                      ? "bg-white/20"
                      : `bg-gradient-to-br ${cat.color}`
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white"}`} />
                </div>
                <span className="text-xs font-semibold leading-tight text-center">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured restaurants */}
      {!search && !activeCategory && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-base">⭐ Más Populares</h2>
            <button className="text-sm text-pinol-600 font-semibold flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-52 h-52 bg-gray-100 rounded-2xl animate-pulse"
                  />
                ))
              : restaurants
                  .filter((r) => r.rating >= 4)
                  .slice(0, 8)
                  .map((r) => (
                    <div key={r.id} className="flex-shrink-0 w-52">
                      <RestaurantCard restaurant={r} variant="vertical" />
                    </div>
                  ))}
          </div>
        </div>
      )}

      {/* All restaurants / Filtered results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">
            {search
              ? `Resultados para "${search}"`
              : activeCategory
              ? getCategoryLabel(activeCategory)
              : "Restaurantes Cercanos"}
          </h2>
          <span className="text-sm text-gray-400">{filtered.length} resultados</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-gray-700 text-lg">Sin resultados</h3>
            <p className="text-gray-400 text-sm mt-1">
              Intenta con otra búsqueda o categoría
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory(null);
              }}
              className="mt-4 text-pinol-600 font-semibold text-sm"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} variant="vertical" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
