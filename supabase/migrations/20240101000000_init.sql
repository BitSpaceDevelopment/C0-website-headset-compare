-- VR Comparison Tool Schema

CREATE TABLE devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  brand       TEXT NOT NULL,
  image_url   TEXT,
  price       NUMERIC,
  currency    TEXT DEFAULT 'CAD',
  buy_url     TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spec_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE spec_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES spec_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE device_specs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID REFERENCES devices(id) ON DELETE CASCADE,
  spec_item_id UUID REFERENCES spec_items(id) ON DELETE CASCADE,
  value        TEXT,
  UNIQUE (device_id, spec_item_id)
);

ALTER TABLE devices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_specs     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read devices"     ON devices          FOR SELECT USING (true);
CREATE POLICY "auth write devices"      ON devices          FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "public read categories"  ON spec_categories  FOR SELECT USING (true);
CREATE POLICY "auth write categories"   ON spec_categories  FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "public read items"       ON spec_items       FOR SELECT USING (true);
CREATE POLICY "auth write items"        ON spec_items       FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "public read specs"       ON device_specs     FOR SELECT USING (true);
CREATE POLICY "auth write specs"        ON device_specs     FOR ALL    USING (auth.role() = 'authenticated');
