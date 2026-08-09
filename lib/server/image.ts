import { supabase } from './supabase'

const allowedTypes = ['image/jpeg', 'image/png']
const maxSize = 6 * 1024 * 1024

export function imageError(image: File) {
  if (!allowedTypes.includes(image.type)) return 'JPG 또는 PNG 이미지만 가능합니다.'
  if (image.size > maxSize) return '이미지는 6MB 이하여야 합니다.'
  return null
}

export function imageExtension(image: File) {
  return image.type === 'image/png' ? 'png' : 'jpg'
}

export function imageUrl(path: string) {
  return supabase.storage.from('observations').getPublicUrl(path).data.publicUrl
}
