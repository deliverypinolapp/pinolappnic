import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const isOpen = searchParams.get("is_open");

  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (category) query = query.eq("category", category);
  if (isOpen === "true") query = query.eq("is_open", true);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Check if user is restaurant_owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "restaurant_owner" && profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Solo propietarios pueden crear restaurantes" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    name,
    description,
    address,
    phone,
    category,
    delivery_time_min,
    delivery_time_max,
    delivery_fee,
    min_order,
  } = body;

  if (!name || !address) {
    return NextResponse.json(
      { error: "Nombre y dirección son requeridos" },
      { status: 400 }
    );
  }

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name,
      description: description || "",
      address,
      phone: phone || "",
      category: category || "restaurant",
      delivery_time_min: delivery_time_min || 25,
      delivery_time_max: delivery_time_max || 45,
      delivery_fee: delivery_fee || 60,
      min_order: min_order || 100,
      is_open: true,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: restaurant, success: true });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  // Verify ownership
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("owner_id")
    .eq("id", id)
    .single();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (restaurant?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}
