"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Clock,
  Star,
  Phone,
  MapPin,
  Truck,
  ShoppingCart,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Restaurant, MenuCategory, MenuItem, Promotion } from "@/types";
import MenuItemCard from "@/components/restaurant/MenuItemCard";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import StarRating from "@/components/ui/StarRating";
import Badge from "@/components/ui/Badge";
import toast from "react-hot-toast";

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const id = params.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { items: cartItems, getItemCount } = useCartStore();
  const cartCount = getItemCount();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load restaurant
        const { data: rest, error: restErr } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .single();

        if (restErr || !rest) {
          toast.error("Restaurante no encontrado");
          router.push("/");
          return;
        }
        setRestaurant(rest as Restaurant);

        // Load categories
        const { data: cats } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("restaurant_id", id)
          .eq("is_active", true)
          .order("sort_order");
        setCategories((cats as MenuCategory[]) || []);

        // Load menu items
        const { data: items } = await supabase
          .from("menu_items")
          .select("*")
          .eq("restaurant_id", id)
          .order("is_featured", { ascending: false });
        setMenuItems((items as MenuItem[]) || []);

        // Load promotions
        const { data: promos } = await supabase
          .from("promotions")
          .select("*, menu_item:menu_items(*)")
          .eq("restaurant_id", id)
          .eq("is_active", true);
        setPromotions((promos as Promotion[]) || []);
      } catch {
        toast.error("Error al cargar el restaurante");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const itemsByCategory = (categoryId: string | null) => {
    return menuItems.filter((item) =>
      categoryId ? item.category_id === categoryId : !item.category_id
    );
  };

  const featuredItems = menuItems.filter((item) => item.is_featured);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-56 bg-gray-200 animate-pulse" />
        <div className="p-4 space-y-4">
          <div className="h-6 bg-gray-200 rounded-xl animate-pulse w-48" />
          <div className="h-4 bg-gray-200 rounded-xl animate-pulse w-32" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Hero cover */}
      <div className="relative h-56 bg-gray-200">
        {restaurant.cover_url ? (
          <Image
            src={restaurant.cover_url}
            alt={restaurant.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pinol-100 to-pinol-300 flex items-center justify-center">
            <Store className="w-20 h-20 text-pinol-400" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Cart button */}
        <Link
          href="/cart"
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-md relative hover:bg-white transition-colors"
        >
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-pinol-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Restaurant info */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 -mt-10 rounded-2xl border-2 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
            {restaurant.logo_url ? (
              <Image
                src={restaurant.logo_url}
                alt={restaurant.name}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pinol-500 to-pinol-600 flex items-center justify-center">
                <Store className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-black text-xl text-gray-900">{restaurant.name}</h1>
              <Badge variant={restaurant.is_open ? "green" : "red"}>
                {restaurant.is_open ? "Abierto" : "Cerrado"}
              </Badge>
            </div>
            {restaurant.description && (
              <p className="text-sm text-gray-500 mt-1">{restaurant.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-bold text-gray-900 text-sm">{restaurant.rating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({restaurant.total_reviews})</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-pinol-500" />
            <span>{restaurant.delivery_time_min}-{restaurant.delivery_time_max} min</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="flex items-center gap-1.5 text-sm">
            <Truck className="w-4 h-4 text-pinol-500" />
            <span className="font-semibold text-pinol-700">{formatCurrency(restaurant.delivery_fee)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>{restaurant.address}</span>
        </div>
      </div>

      {/* Promotions / Ofertas del día */}
      {promotions.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="font-bold text-gray-900 mb-3">🔥 Ofertas del Día</h2>
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl"
              >
                {promo.menu_item?.image_url && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <Image
                      src={promo.menu_item.image_url}
                      alt={promo.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{promo.title}</p>
                  {promo.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{promo.description}</p>
                  )}
                  {promo.menu_item && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(promo.menu_item.price)}
                      </span>
                      <span className="text-sm font-bold text-pinol-700">
                        {formatCurrency(
                          promo.discount_type === "percentage"
                            ? promo.menu_item.price * (1 - promo.discount_value / 100)
                            : promo.menu_item.price - promo.discount_value
                        )}
                      </span>
                      <Badge variant="red" size="sm">
                        -{promo.discount_value}{promo.discount_type === "percentage" ? "%" : ` C$`}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="mt-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                !activeCategory
                  ? "bg-pinol-600 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-pinol-300"
              }`}
            >
              Todo
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? "bg-pinol-600 text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-pinol-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="px-4 mt-4 space-y-6">
        {/* Featured items */}
        {!activeCategory && featuredItems.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">⭐ Destacados</h2>
            <div className="space-y-3">
              {featuredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}

        {/* By category */}
        {categories.length > 0 ? (
          categories
            .filter((cat) => !activeCategory || cat.id === activeCategory)
            .map((cat) => {
              const items = itemsByCategory(cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h2 className="font-bold text-gray-900 mb-3">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-sm text-gray-500 -mt-1 mb-3">{cat.description}</p>
                  )}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
                    ))}
                  </div>
                </div>
              );
            })
        ) : (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">🍽️ Menú</h2>
            <div className="space-y-3">
              {menuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-gray-500">No hay items en el menú aún</p>
          </div>
        )}
      </div>

      {/* Sticky cart button */}
      {cartItems.length > 0 && cartItems[0]?.restaurant_id === restaurant.id && (
        <div className="fixed bottom-6 left-0 right-0 max-w-2xl mx-auto px-4 z-30">
          <Link href="/cart">
            <button className="w-full bg-pinol-600 text-white py-4 rounded-2xl font-bold text-base shadow-2xl hover:bg-pinol-700 transition-all flex items-center justify-between px-5 active:scale-98">
              <div className="bg-pinol-700 rounded-xl px-2.5 py-1 text-sm font-bold">
                {cartItems.length} items
              </div>
              <span>Ver mi pedido</span>
              <span className="font-bold">
                {formatCurrency(useCartStore.getState().getSubtotal())}
              </span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
