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
  created_at: string
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

export type DeviceFormData = Omit<Device, 'id' | 'created_at'>
