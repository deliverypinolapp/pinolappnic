"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Bell,
  MapPin,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  Store,
  Truck,
  Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Profile } from "@/types";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const { user, profile, setUser, setProfile } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(prof as Profile);

        // Count unread notifications
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        setNotifications(count || 0);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          setProfile(prof as Profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success("Sesión cerrada");
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!profile) return null;
    if (profile.role === "restaurant_owner") return "/dashboard/restaurant";
    if (profile.role === "driver") return "/dashboard/driver";
    if (profile.role === "admin") return "/admin";
    return null;
  };

  const isActive = (path: string) => pathname === path;

  if (pathname === "/" && !user) return null; // Ocultar en splash

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">🛍</span>
            </div>
            <span className="font-bold text-xl">
              <span className="text-gray-900">Pinol</span>
              <span className="text-pinol-600">App</span>
            </span>
          </Link>

          {/* Location (desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <MapPin className="w-4 h-4 text-pinol-600" />
              <span className="max-w-[180px] truncate">
                {profile?.address || "Managua, Nicaragua"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          )}

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive("/")
                  ? "text-pinol-600 bg-pinol-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Inicio
            </Link>
            {user && (
              <Link
                href="/orders"
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/orders")
                    ? "text-pinol-600 bg-pinol-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Mis Pedidos
              </Link>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {notifications > 9 ? "9+" : notifications}
                    </span>
                  )}
                </button>

                {/* Cart */}
                <Link
                  href="/cart"
                  className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-pinol-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse-green">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-pinol-500 to-pinol-700 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        getInitials(profile?.full_name || "U")
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-500 hidden md:block" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-12 z-20 bg-white rounded-2xl shadow-xl border border-gray-100 w-56 py-2 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {profile?.full_name || "Usuario"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
                        </div>

                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          Mi Perfil
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Package className="w-4 h-4 text-gray-400" />
                          Mis Pedidos
                        </Link>

                        {getDashboardLink() && (
                          <Link
                            href={getDashboardLink()!}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {profile?.role === "restaurant_owner" && <Store className="w-4 h-4 text-gray-400" />}
                            {profile?.role === "driver" && <Truck className="w-4 h-4 text-gray-400" />}
                            {profile?.role === "admin" && <Shield className="w-4 h-4 text-gray-400" />}
                            {profile?.role === "restaurant_owner" && "Mi Restaurante"}
                            {profile?.role === "driver" && "Panel Repartidor"}
                            {profile?.role === "admin" && "Administración"}
                          </Link>
                        )}

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-pinol-600 text-white text-sm font-semibold rounded-2xl hover:bg-pinol-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                🏠 Inicio
              </Link>
              {user && (
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  📦 Mis Pedidos
                </Link>
              )}
              {user && (
                <Link
                  href="/cart"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  🛒 Carrito {itemCount > 0 && `(${itemCount})`}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
