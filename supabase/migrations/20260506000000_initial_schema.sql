-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    limited_time BOOLEAN DEFAULT FALSE,
    sold_out BOOLEAN DEFAULT FALSE,
    badge_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Extends Auth Users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    shipping_address JSONB,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table (Aligned with webhook and admin dashboard)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    shipping_address JSONB,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    fulfillment_status TEXT DEFAULT 'RECEIVED',
    notes TEXT,
    batch_id TEXT,
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    base_name TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and products
CREATE POLICY "Allow public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access for products" ON products FOR SELECT USING (true);

-- Profile policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Order policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Order items policies
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Insert Initial Categories
INSERT INTO categories (name, slug, description) VALUES
('Cookie Series', 'cookie', 'Crunchy, chewy, and loaded with inclusions. The ultimate texture experience.'),
('Cake Series', 'cake', 'Soft, rich sponge cake enveloped in our signature thick chocolate shell.'),
('Fusion Series', 'fusion', 'Wild flavor combinations. Caramel, cheesecake, and specialty fillings.');

-- Insert Initial Products
INSERT INTO products (category_id, name, slug, description, price, image_url, limited_time, sold_out, badge_text)
SELECT id, 'Plain Cookie Dough', 'plain-cookie-dough', 'Our signature thick cookie dough, completely unadulterated. Pure, rich, and gooey.', 5.99, '/cookie.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Chocolate Chip Cookie Dough', 'choc-chip-cookie-dough', 'Classic cookie dough loaded with premium Belgian chocolate chips.', 6.99, '/cookie.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Dark Choc Chip Cookie Dough', 'dark-choc-chip-cookie-dough', 'Rich cookie dough with intense 70% dark chocolate chips.', 6.99, '/cookie.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Pistachio Cookie Dough', 'pistachio-cookie-dough', 'Premium roasted pistachios folded into our signature dough.', 7.99, '/cookie.png', TRUE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Peanut Butter Cookie Dough', 'peanut-butter-cookie-dough', 'Swirls of smooth peanut butter in rich cookie dough.', 6.99, '/cookie.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Fudge Cookie Dough', 'fudge-cookie-dough', 'Gooey fudge pieces mixed into our classic dough.', 6.49, NULL, FALSE, FALSE, NULL FROM categories WHERE slug = 'cookie'
UNION ALL
SELECT id, 'Classic Vanilla Sponge', 'classic-sponge', 'Light, fluffy Madagascar vanilla sponge cake.', 5.99, '/sponge.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cake'
UNION ALL
SELECT id, 'Coffee & Walnut', 'coffee-walnut', 'Espresso-infused sponge with crushed toasted walnuts.', 6.99, '/coffee-cake.png', FALSE, FALSE, NULL FROM categories WHERE slug = 'cake'
UNION ALL
SELECT id, 'Rich Fudge Brownie', 'rich-brownie', 'Dense fudge brownie.', 7.49, '/brownie.png', FALSE, TRUE, NULL FROM categories WHERE slug = 'cake'
UNION ALL
SELECT id, 'Peanut Butter Fudge and Salted Caramel Pretzels', 'pb-fudge-caramel-fusion', 'Our most indulgent fusion yet. Swirls of peanut butter fudge topped with salted caramel pretzels.', 8.99, '/peanutbutter-fudge.png', FALSE, FALSE, 'MADE WITH FLIPZ' FROM categories WHERE slug = 'fusion'
UNION ALL
SELECT id, 'Peanut Butter and Salted Caramel Pretzel', 'peanut-butter-salted-caramel', 'Wild flavor combinations. Caramel, cheesecake, and specialty fillings.', 7.49, NULL, FALSE, FALSE, NULL FROM categories WHERE slug = 'fusion'
UNION ALL
SELECT id, 'NY Vanilla Cheesecake', 'ny-cheesecake', 'Baked vanilla cheesecake filling.', 7.99, NULL, FALSE, FALSE, NULL FROM categories WHERE slug = 'fusion';

