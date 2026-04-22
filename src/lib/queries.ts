import { devices, manufacturers, specCategories, deviceSpecs } from '../data/data'
import type { Device, Manufacturer, SpecCategory, DeviceSpec, DeviceMedia } from '../types'

// All hooks return synchronous static data in the same shape as the old TanStack Query hooks.

export function useDevices(activeOnly = false) {
  const data = activeOnly ? devices.filter(d => d.is_active) : devices
  return { data, isLoading: false }
}

export function useDevice(id: string) {
  const data = devices.find(d => d.id === id) ?? null
  return { data: data as Device | null, isLoading: false }
}

export function useManufacturers() {
  return { data: manufacturers as Manufacturer[], isLoading: false }
}

export function useManufacturer(id: string | null | undefined) {
  const data = id ? (manufacturers.find(m => m.id === id) ?? null) : null
  return { data: data as Manufacturer | null, isLoading: false }
}

export function useSpecCategories() {
  return { data: specCategories as SpecCategory[], isLoading: false }
}

export function useDeviceSpecs(deviceIds: string[]) {
  const data = deviceIds.length
    ? deviceSpecs.filter(s => deviceIds.includes(s.device_id))
    : []
  return { data: data as DeviceSpec[], isLoading: false }
}

export function useAllDeviceSpecs() {
  return { data: deviceSpecs as DeviceSpec[], isLoading: false }
}

export function useDeviceMedia(_deviceId: string | null | undefined) {
  return { data: [] as DeviceMedia[], isLoading: false }
}
