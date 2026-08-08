-- MilletsNow QR Feedback & Product Traceability System
-- PostgreSQL schema foundation (Phase 2)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'analyst', 'operator');
CREATE TYPE user_status AS ENUM ('invited', 'active', 'suspended', 'deactivated');
CREATE TYPE qr_code_status AS ENUM ('active', 'paused', 'revoked');
CREATE TYPE feedback_status AS ENUM ('new', 'in_review', 'resolved', 'archived');
CREATE TYPE notification_type AS ENUM ('feedback', 'complaint', 'system', 'campaign');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  status user_status NOT NULL DEFAULT 'invited',
  avatar_url TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_format_ck CHECK (position('@' IN email) > 1)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_name_ck CHECK (length(trim(name)) > 0)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_name_ck CHECK (length(trim(name)) > 0),
  CONSTRAINT products_sku_ck CHECK (length(trim(sku)) > 0)
);

CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_batches_product_number_uq UNIQUE (product_id, batch_number),
  CONSTRAINT product_batches_quantity_ck CHECK (quantity >= 0),
  CONSTRAINT product_batches_dates_ck CHECK (expiry_date IS NULL OR manufacturing_date IS NULL OR expiry_date >= manufacturing_date)
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customers_contact_ck CHECK (email IS NOT NULL OR phone IS NOT NULL OR full_name IS NOT NULL)
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status qr_code_status NOT NULL DEFAULT 'active',
  destination_url TEXT,
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
  qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  rating SMALLINT,
  message TEXT,
  status feedback_status NOT NULL DEFAULT 'new',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT feedback_rating_ck CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL UNIQUE REFERENCES feedback(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_question_ck CHECK (length(trim(question)) > 0)
);

CREATE TABLE compliments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL UNIQUE REFERENCES feedback(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT compliments_message_ck CHECK (length(trim(message)) > 0)
);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL UNIQUE REFERENCES feedback(id) ON DELETE CASCADE,
  severity SMALLINT NOT NULL DEFAULT 1,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT complaints_severity_ck CHECK (severity BETWEEN 1 AND 5)
);

CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL UNIQUE REFERENCES feedback(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  implemented BOOLEAN NOT NULL DEFAULT FALSE,
  implemented_by UUID REFERENCES users(id) ON DELETE SET NULL,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT suggestions_message_ck CHECK (length(trim(suggestion)) > 0)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT activity_logs_action_ck CHECK (length(trim(action)) > 0)
);

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_user_key_uq UNIQUE (user_id, setting_key)
);

CREATE INDEX categories_parent_id_idx ON categories(parent_id);
CREATE INDEX products_category_id_idx ON products(category_id);
CREATE INDEX products_created_by_idx ON products(created_by);
CREATE INDEX product_batches_product_id_idx ON product_batches(product_id);
CREATE INDEX product_batches_expiry_date_idx ON product_batches(expiry_date);
CREATE INDEX qr_codes_product_id_idx ON qr_codes(product_id);
CREATE INDEX qr_codes_batch_id_idx ON qr_codes(batch_id);
CREATE INDEX qr_codes_status_idx ON qr_codes(status);
CREATE INDEX qr_scan_logs_qr_code_id_idx ON qr_scan_logs(qr_code_id);
CREATE INDEX qr_scan_logs_customer_id_idx ON qr_scan_logs(customer_id);
CREATE INDEX qr_scan_logs_scanned_at_idx ON qr_scan_logs(scanned_at DESC);
CREATE INDEX customers_email_idx ON customers(email);
CREATE INDEX feedback_product_id_idx ON feedback(product_id);
CREATE INDEX feedback_customer_id_idx ON feedback(customer_id);
CREATE INDEX feedback_status_idx ON feedback(status);
CREATE INDEX feedback_submitted_at_idx ON feedback(submitted_at DESC);
CREATE INDEX notifications_user_unread_idx ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX activity_logs_entity_idx ON activity_logs(entity_type, entity_id);
CREATE INDEX activity_logs_user_created_at_idx ON activity_logs(user_id, created_at DESC);
CREATE INDEX settings_key_idx ON settings(setting_key);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'products', 'categories', 'product_batches', 'qr_codes', 'qr_scan_logs',
    'customers', 'feedback', 'questions', 'compliments', 'complaints', 'suggestions',
    'notifications', 'activity_logs', 'settings'
  ] LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END;
$$;
