import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type {
  Device, DeviceFormData,
  Manufacturer, ManufacturerFormData, ManufacturerImage,
  SpecCategory, SpecItem, DeviceSpec, DeviceMedia,
} from '../types'

// ─── Devices ──────────────────────────────────────────────────────────────────

export function useDevices(activeOnly = false) {
  return useQuery<Device[]>({
    queryKey: ['devices', activeOnly],
    queryFn: async () => {
      let q = supabase.from('devices').select('*').order('brand').order('name')
      if (activeOnly) q = q.eq('is_active', true)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useDevice(id: string) {
  return useQuery<Device>({
    queryKey: ['device', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('devices').select('*').eq('id', id).single()
      if (error) throw error
      return data as Device
    },
    enabled: !!id,
  })
}

export function useCreateDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: DeviceFormData) => {
      const { data, error } = await supabase.from('devices').insert(payload).select().single()
      if (error) throw error
      return data as Device
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  })
}

export function useUpdateDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: DeviceFormData & { id: string }) => {
      const { data, error } = await supabase.from('devices').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Device
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      qc.invalidateQueries({ queryKey: ['device', vars.id] })
    },
  })
}

export function useDeleteDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      qc.invalidateQueries({ queryKey: ['device_specs_all'] })
    },
  })
}

// ─── Manufacturers ─────────────────────────────────────────────────────────────

export function useManufacturers() {
  return useQuery<Manufacturer[]>({
    queryKey: ['manufacturers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('manufacturers').select('*').order('name')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useManufacturer(id: string | null | undefined) {
  return useQuery<Manufacturer | null>({
    queryKey: ['manufacturer', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase.from('manufacturers').select('*').eq('id', id).single()
      if (error) throw error
      return data as Manufacturer
    },
    enabled: !!id,
  })
}

export function useCreateManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: ManufacturerFormData) => {
      const { data, error } = await supabase.from('manufacturers').insert(payload).select().single()
      if (error) throw error
      return data as Manufacturer
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manufacturers'] }),
  })
}

export function useUpdateManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: ManufacturerFormData & { id: string }) => {
      const { data, error } = await supabase.from('manufacturers').update(payload).eq('id', id).select().single()
      if (error) throw error
      return data as Manufacturer
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['manufacturers'] })
      qc.invalidateQueries({ queryKey: ['manufacturer', vars.id] })
    },
  })
}

export function useDeleteManufacturer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('manufacturers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manufacturers'] }),
  })
}

// ─── Manufacturer Images ────────────────────────────────────────────────────────

export function useManufacturerImages(manufacturerId: string | null | undefined) {
  return useQuery<ManufacturerImage[]>({
    queryKey: ['manufacturer_images', manufacturerId],
    queryFn: async () => {
      if (!manufacturerId) return []
      const { data, error } = await supabase
        .from('manufacturer_images')
        .select('*')
        .eq('manufacturer_id', manufacturerId)
        .order('order_index')
      if (error) throw error
      return data ?? []
    },
    enabled: !!manufacturerId,
  })
}

export function useAddManufacturerImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { manufacturer_id: string; url: string; caption?: string }) => {
      const { data: existing } = await supabase
        .from('manufacturer_images')
        .select('order_index')
        .eq('manufacturer_id', payload.manufacturer_id)
        .order('order_index', { ascending: false })
        .limit(1)
      const next = ((existing?.[0]?.order_index ?? -1) as number) + 1
      const { data, error } = await supabase
        .from('manufacturer_images')
        .insert({ ...payload, order_index: next })
        .select()
        .single()
      if (error) throw error
      return data as ManufacturerImage
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['manufacturer_images', vars.manufacturer_id] }),
  })
}

export function useDeleteManufacturerImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, manufacturer_id }: { id: string; manufacturer_id: string }) => {
      const { error } = await supabase.from('manufacturer_images').delete().eq('id', id)
      if (error) throw error
      return manufacturer_id
    },
    onSuccess: (manufacturer_id) =>
      qc.invalidateQueries({ queryKey: ['manufacturer_images', manufacturer_id] }),
  })
}

// ─── Spec Categories + Items ──────────────────────────────────────────────────

export function useSpecCategories() {
  return useQuery<SpecCategory[]>({
    queryKey: ['spec_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spec_categories')
        .select('*, spec_items(*)')
        .order('order_index')
      if (error) throw error
      const rows = (data ?? []) as SpecCategory[]
      rows.forEach(cat => {
        cat.spec_items = (cat.spec_items ?? []).sort((a, b) => a.order_index - b.order_index)
      })
      return rows
    },
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: existing } = await supabase.from('spec_categories').select('order_index').order('order_index', { ascending: false }).limit(1)
      const next = ((existing?.[0]?.order_index ?? 0) as number) + 1
      const { data, error } = await supabase.from('spec_categories').insert({ name, order_index: next }).select().single()
      if (error) throw error
      return data as SpecCategory
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('spec_categories').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spec_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

export function useCreateSpecItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ category_id, name }: { category_id: string; name: string }) => {
      const { data: existing } = await supabase.from('spec_items').select('order_index').eq('category_id', category_id).order('order_index', { ascending: false }).limit(1)
      const next = ((existing?.[0]?.order_index ?? 0) as number) + 1
      const { data, error } = await supabase.from('spec_items').insert({ category_id, name, order_index: next }).select().single()
      if (error) throw error
      return data as SpecItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

export function useUpdateSpecItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('spec_items').update({ name }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

export function useDeleteSpecItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('spec_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spec_categories'] }),
  })
}

// ─── Device Specs ─────────────────────────────────────────────────────────────

export function useDeviceSpecs(deviceIds: string[]) {
  return useQuery<DeviceSpec[]>({
    queryKey: ['device_specs', deviceIds],
    queryFn: async () => {
      if (deviceIds.length === 0) return []
      const { data, error } = await supabase
        .from('device_specs')
        .select('*')
        .in('device_id', deviceIds)
      if (error) throw error
      return data ?? []
    },
    enabled: deviceIds.length > 0,
  })
}

export function useAllDeviceSpecs() {
  return useQuery<DeviceSpec[]>({
    queryKey: ['device_specs_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('device_specs').select('*')
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })
}

export function useUpsertDeviceSpecs() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (specs: { device_id: string; spec_item_id: string; value: string }[]) => {
      const { error } = await supabase.from('device_specs').upsert(specs, { onConflict: 'device_id,spec_item_id' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['device_specs'] })
      qc.invalidateQueries({ queryKey: ['device_specs_all'] })
    },
  })
}

// ─── Device Media ──────────────────────────────────────────────────────────────

export function useDeviceMedia(deviceId: string | null | undefined) {
  return useQuery<DeviceMedia[]>({
    queryKey: ['device_media', deviceId],
    queryFn: async () => {
      if (!deviceId) return []
      const { data, error } = await supabase
        .from('device_media')
        .select('*')
        .eq('device_id', deviceId)
        .order('order_index')
      if (error) throw error
      return data ?? []
    },
    enabled: !!deviceId,
  })
}

export function useAddDeviceMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { device_id: string; type: 'image' | 'youtube'; url: string; caption?: string }) => {
      const { data: existing } = await supabase
        .from('device_media')
        .select('order_index')
        .eq('device_id', payload.device_id)
        .order('order_index', { ascending: false })
        .limit(1)
      const next = ((existing?.[0]?.order_index ?? -1) as number) + 1
      const { data, error } = await supabase
        .from('device_media')
        .insert({ ...payload, order_index: next })
        .select()
        .single()
      if (error) throw error
      return data as DeviceMedia
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['device_media', vars.device_id] }),
  })
}

export function useDeleteDeviceMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, device_id }: { id: string; device_id: string }) => {
      const { error } = await supabase.from('device_media').delete().eq('id', id)
      if (error) throw error
      return device_id
    },
    onSuccess: (device_id) =>
      qc.invalidateQueries({ queryKey: ['device_media', device_id] }),
  })
}
