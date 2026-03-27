-- ================================================================
-- PINOLAPP - SCHEMA COMPLETO DE BASE DE DATOS
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalización (opcional)

-- ================================================================
-- TABLA: profiles (usuarios)
-- ================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'restaurant_owner', 'driver', 'admin')),
  address TEXT DEFAULT '',
  address_lat DECIMAL(10, 8) DEFAULT 12.1328,
  address_lng DECIMAL(11, 8) DEFAULT -86.2504,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: restaurants
-- ================================================================
CREATE TABLE restaurants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  cover_url TEXT DEFAULT '',
  address TEXT NOT NULL,
  lat DECIMAL(10, 8) DEFAULT 12.1328,
  lng DECIMAL(11, 8) DEFAULT -86.2504,
  phone TEXT DEFAULT '',
  category TEXT DEFAULT 'restaurant' CHECK (category IN ('restaurant', 'fast_food', 'pharmacy', 'market', 'bakery', 'drinks')),
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  delivery_time_min INTEGER DEFAULT 25,
  delivery_time_max INTEGER DEFAULT 45,
  delivery_fee DECIMAL(10, 2) DEFAULT 60.00,
  min_order DECIMAL(10, 2) DEFAULT 100.00,
  is_open BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  opening_time TIME DEFAULT '08:00:00',
  closing_time TIME DEFAULT '22:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: menu_categories
-- ================================================================
CREATE TABLE menu_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: menu_items
-- ================================================================
CREATE TABLE menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) DEFAULT NULL,
  image_url TEXT DEFAULT '',
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 15,
  calories INTEGER DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: drivers
-- ================================================================
CREATE TABLE drivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'car')),
  license_plate TEXT DEFAULT '',
  is_available BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  current_lat DECIMAL(10, 8) DEFAULT 12.1328,
  current_lng DECIMAL(11, 8) DEFAULT -86.2504,
  rating DECIMAL(3, 2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: orders
-- ================================================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled')
  ),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_address JSONB NOT NULL DEFAULT '{}',
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  notes TEXT DEFAULT '',
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: order_status_history
-- ================================================================
CREATE TABLE order_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: reviews
-- ================================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  restaurant_rating INTEGER CHECK (restaurant_rating BETWEEN 1 AND 5) NOT NULL,
  driver_rating INTEGER CHECK (driver_rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: promotions (ofertas del dia)
-- ================================================================
CREATE TABLE promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TABLA: notifications
-- ================================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'order_update', 'promotion', 'system')),
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FUNCIONES Y TRIGGERS
-- ================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  num TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    num := 'PIN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = num) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN num;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar order_number automáticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Función para registrar historial de estado de orden
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (NEW.id, NEW.status, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- Función para actualizar rating de restaurante
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3, 2);
  review_count INTEGER;
BEGIN
  SELECT AVG(restaurant_rating), COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE restaurant_id = NEW.restaurant_id;

  UPDATE restaurants
  SET rating = ROUND(avg_rating, 2), total_reviews = review_count
  WHERE id = NEW.restaurant_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_rating();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

-- RESTAURANTS (todos pueden ver, solo owner puede modificar)
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "restaurants_owner_all" ON restaurants FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "restaurants_admin_all" ON restaurants FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- MENU CATEGORIES
CREATE POLICY "menu_categories_public_read" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "menu_categories_owner_write" ON menu_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- MENU ITEMS
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_owner_write" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- DRIVERS
CREATE POLICY "drivers_public_read" ON drivers FOR SELECT USING (true);
CREATE POLICY "drivers_own_write" ON drivers FOR ALL USING (auth.uid() = user_id);

-- ORDERS
CREATE POLICY "orders_customer_read" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "orders_customer_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "orders_restaurant_read" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "orders_restaurant_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);
CREATE POLICY "orders_driver_read" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM drivers WHERE id = driver_id AND user_id = auth.uid())
);
CREATE POLICY "orders_driver_update" ON orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM drivers WHERE id = driver_id AND user_id = auth.uid())
);
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDER STATUS HISTORY
CREATE POLICY "order_history_read" ON order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND customer_id = auth.uid())
  OR EXISTS (SELECT 1 FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = order_id AND r.owner_id = auth.uid())
);

-- REVIEWS
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_customer_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "reviews_customer_update" ON reviews FOR UPDATE USING (auth.uid() = customer_id);

-- PROMOTIONS
CREATE POLICY "promotions_public_read" ON promotions FOR SELECT USING (is_active = true);
CREATE POLICY "promotions_owner_write" ON promotions FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = restaurant_id AND owner_id = auth.uid())
);

-- NOTIFICATIONS
CREATE POLICY "notifications_own_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurants', 'restaurants', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-items', 'menu-items', true);

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_own_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "restaurants_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'restaurants');
CREATE POLICY "restaurants_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'restaurants' AND auth.role() = 'authenticated');

CREATE POLICY "menu_items_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'menu-items');
CREATE POLICY "menu_items_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-items' AND auth.role() = 'authenticated');

-- ================================================================
-- DATOS DE EJEMPLO (SEED DATA)
-- ================================================================

-- Restaurantes de ejemplo (se insertan manualmente o via app)
-- Los perfiles se crean automáticamente con el trigger

-- ================================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================================
CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ================================================================
-- REALTIME (habilitar para tracking en tiempo real)
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE drivers;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
