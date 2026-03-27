"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, MapPin, Mail, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { Profile } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import toast from "react-hot-toast";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, setProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setPhone(profile.phone);
      setAddress(profile.address);
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, address })
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error al guardar perfil");
      } else {
        setProfile(data as Profile);
        toast.success("Perfil actualizado ✅");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

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
        <h1 className="font-black text-xl text-gray-900">Mi Perfil</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-pinol-400 to-pinol-700 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
          {getInitials(profile.full_name || "U")}
        </div>
        <p className="font-bold text-gray-900 mt-3 text-lg">{profile.full_name}</p>
        <p className="text-sm text-gray-500">{profile.email}</p>
        <div className="mt-2 bg-pinol-100 text-pinol-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
          {profile.role === "customer" ? "Cliente" :
           profile.role === "restaurant_owner" ? "Propietario" :
           profile.role === "driver" ? "Repartidor" : "Admin"}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <Input
          label="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
        />
        <Input
          label="Correo electrónico"
          value={profile.email}
          disabled
          leftIcon={<Mail className="w-4 h-4" />}
          hint="El email no se puede cambiar"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+505 8888-9999"
          leftIcon={<Phone className="w-4 h-4" />}
        />
        <Input
          label="Dirección principal"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Tu barrio, calle..."
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        <Button
          onClick={saveProfile}
          loading={saving}
          fullWidth
          size="lg"
          className="mt-2 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
