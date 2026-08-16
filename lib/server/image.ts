import { supabase } from './supabase'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '@/lib/image-constraints'

export function imageError(image: File) {
  if (!ALLOWED_IMAGE_TYPES.some((type) => type === image.type)) return 'JPG 또는 PNG 이미지만 가능합니다.'
  if (image.size > MAX_IMAGE_SIZE) return '이미지는 6MB 이하여야 합니다.'
  return null
}

export function imageExtension(image: File) {
  return image.type === 'image/png' ? 'png' : 'jpg'
}

export function imageUrl(path: string) {
  return supabase.storage.from('observations').getPublicUrl(path).data.publicUrl
}

/** 프로필 사진 전용 버킷입니다. 관찰 사진과 섞이지 않게 분리해 둡니다. */
export const AVATAR_BUCKET = 'avatars'

export function avatarUrl(path: string) {
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}
