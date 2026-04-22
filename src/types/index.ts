export interface Device {
  id: string
  name: string
  brand: string
  image_url: string | null
  price: number | null
  currency: string
  buy_url: string | null
  is_active: boolean
  is_in_production: boolean
  description: string | null
  manufacturer_id: string | null
  created_at: string
}

export interface Manufacturer {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  description: string | null
  created_at: string
}

export interface ManufacturerImage {
  id: string
  manufacturer_id: string
  url: string
  caption: string | null
  order_index: number
}

export interface SpecCategory {
  id: string
  name: string
  order_index: number
  spec_items?: SpecItem[]
}

export interface SpecItem {
  id: string
  category_id: string
  name: string
  order_index: number
}

export interface DeviceSpec {
  id: string
  device_id: string
  spec_item_id: string
  value: string | null
}

export interface DeviceMedia {
  id: string
  device_id: string
  type: 'image' | 'youtube'
  url: string
  caption: string | null
  order_index: number
}

export type DeviceFormData = Omit<Device, 'id' | 'created_at'>
export type ManufacturerFormData = Omit<Manufacturer, 'id' | 'created_at'>
