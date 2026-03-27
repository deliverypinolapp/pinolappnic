"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";

const registerSchema = z.object({
  full_name: z.string().min(3, "Nombre mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(8, "Teléfono inválido").optional().or(z.literal("")),
  password: z.string().min(8, "Contraseña mínimo 8 caracteres"),
  confirm_password: z.string(),
  role: z.enum(["customer", "restaurant_owner", "driver"]),
}).refine((d) => d.password === d.confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirm_password"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const ROLES = [
  { key: "customer", label: "Cliente", icon: "🧑", desc: "Quiero pedir comida" },
  { key: "restaurant_owner", label: "Restaurante", icon: "🍽️", desc: "Tengo un negocio" },
  { key: "driver", label: "Repartidor", icon: "🛵", desc: "Quiero repartir" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone || "",
            role: data.role,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email ya está registrado");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("¡Cuenta creada! Revisa tu email para verificar 📧");
      router.push("/auth/login");
    } catch {
      toast.error("Error al crear cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pinol-50 to-white flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Volver</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl items-center justify-center shadow-lg mb-4">
              <span className="text-3xl">🛍️</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              Crea tu cuenta
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Únete a PinolApp hoy
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Soy...</p>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setValue("role", role.key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
                    selectedRole === role.key
                      ? "border-pinol-500 bg-pinol-50 text-pinol-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl">{role.icon}</span>
                  <span className="text-xs font-semibold">{role.label}</span>
                  <span className="text-xs text-gray-400 leading-tight hidden sm:block">
                    {role.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Input
              label="Nombre completo"
              type="text"
              placeholder="Carlos García"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register("full_name")}
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Teléfono (opcional)"
              type="tel"
              placeholder="+505 8888-9999"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              {...register("phone")}
            />

            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirmar contraseña"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Crear Cuenta Gratis
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Al registrarte, aceptas nuestros{" "}
            <a href="#" className="text-pinol-600">Términos de Uso</a> y{" "}
            <a href="#" className="text-pinol-600">Política de Privacidad</a>
          </p>

          <p className="text-center text-sm text-gray-600 mt-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="font-semibold text-pinol-600">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
