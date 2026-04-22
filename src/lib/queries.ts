import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Device, DeviceFormData, SpecCategory, SpecItem, DeviceSpec } from '../types'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  })
}

export function useDeleteDevice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['device_specs'] }),
  })
}
