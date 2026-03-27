import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurant_id");
  const customerId = searchParams.get("customer_id");
  const status = searchParams.get("status");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let query = supabase
    .from("orders")
    .select(`
      *,
      restaurant:restaurants(name, logo_url),
      customer:profiles(full_name, phone),
      driver:drivers(*, profile:profiles(full_name, phone))
    `)
    .order("created_at", { ascending: false });

  if (restaurantId) query = query.eq("restaurant_id", restaurantId);
  if (customerId) query = query.eq("customer_id", customerId);
  if (status) query = query.eq("status", status);

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

  const body = await request.json();
  const { restaurant_id, items, delivery_address, notes, payment_method } = body;

  if (!restaurant_id || !items?.length || !delivery_address) {
    return NextResponse.json(
      { error: "Datos incompletos" },
      { status: 400 }
    );
  }

  // Get restaurant info for delivery fee
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("delivery_fee, is_open")
    .eq("id", restaurant_id)
    .single();

  if (!restaurant?.is_open) {
    return NextResponse.json(
      { error: "El restaurante está cerrado" },
      { status: 400 }
    );
  }

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );
  const delivery_fee = restaurant.delivery_fee || 0;
  const total = subtotal + delivery_fee;

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      restaurant_id,
      status: "pending",
      items,
      subtotal,
      delivery_fee,
      discount: 0,
      total,
      delivery_address,
      payment_method: payment_method || "cash",
      payment_status: "pending",
      notes: notes || "",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify restaurant owner
  const { data: restData } = await supabase
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurant_id)
    .single();

  if (restData) {
    await supabase.from("notifications").insert({
      user_id: restData.owner_id,
      title: "Nuevo Pedido 🔔",
      body: `Pedido #${order.order_number} · ${formatCurrency(total)}`,
      type: "order_update",
      data: { order_id: order.id },
    });
  }

  return NextResponse.json({ data: order, success: true });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { order_id, status, driver_id, cancellation_reason } = body;

  if (!order_id || !status) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const updateData: any = { status };
  if (driver_id) updateData.driver_id = driver_id;
  if (status === "delivered") updateData.delivered_at = new Date().toISOString();
  if (status === "cancelled") {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancellation_reason = cancellation_reason || "Sin motivo";
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", order_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, success: true });
}

function formatCurrency(amount: number): string {
  return `C$${amount.toFixed(2)}`;
}
