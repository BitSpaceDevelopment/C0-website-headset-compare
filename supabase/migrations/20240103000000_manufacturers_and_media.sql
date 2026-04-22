-- Manufacturers
CREATE TABLE manufacturers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  website_url TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Manufacturer image gallery
CREATE TABLE manufacturer_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  caption         TEXT,
  order_index     INTEGER NOT NULL DEFAULT 0
);

-- Device media (additional images + YouTube videos)
CREATE TABLE device_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID REFERENCES devices(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('image', 'youtube')),
  url         TEXT NOT NULL,
  caption     TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- New device fields
ALTER TABLE devices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL;

-- RLS: public read, authenticated write
ALTER TABLE manufacturers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_media         ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read manufacturers"       ON manufacturers       FOR SELECT USING (true);
CREATE POLICY "auth write manufacturers"        ON manufacturers       FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "public read mfr_images"          ON manufacturer_images FOR SELECT USING (true);
CREATE POLICY "auth write mfr_images"           ON manufacturer_images FOR ALL    USING (auth.role() = 'authenticated');
CREATE POLICY "public read device_media"        ON device_media        FOR SELECT USING (true);
CREATE POLICY "auth write device_media"         ON device_media        FOR ALL    USING (auth.role() = 'authenticated');
