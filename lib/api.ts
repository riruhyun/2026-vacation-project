import type {
  ApiResponse,
  HealthResponse,
} from '@/types/api'
import type { IdentifyResponseDto } from '@/types/identify'
import type { PlantOrgan } from '@/types/domain'
import type {
  CreateObservationInput,
  CreateObservationResponseDto,
} from '@/types/observation'
import type {
  CollectionResponseDto,
  PlantDetailResponseDto,
} from '@/types/plant'
import type {
  ProfileResponse,
  UpdateProfileInput,
  UpdateProfileResponse,
} from '@/types/user'
import type { ActivitiesResponseDto } from '@/types/activity'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  get isNotIdentified() {
    return this.status === 422
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

function getServerBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function resolveRequestUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  if (typeof window !== 'undefined') return path
  return new URL(path, getServerBaseUrl()).toString()
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    const headers = new Headers(init?.headers)
    if (typeof window === 'undefined') {
      try {
        const { cookies } = await import('next/headers')
        const cookie = (await cookies()).toString()
        if (cookie) headers.set('cookie', cookie)
      } catch {
        // Tests and non-request server work have no Next.js cookie store.
      }
    }
    response = await fetch(resolveRequestUrl(path), {
      ...init,
      headers,
      cache: init?.cache ?? 'no-store',
    })
  } catch {
    throw new ApiError('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', 0)
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null

  if (!body) {
    throw new ApiError('서버 응답을 읽지 못했습니다.', response.status)
  }

  if (!body.success) {
    throw new ApiError(body.error.message, response.status, body.error.details)
  }

  return body.data
}

export function getHealth() {
  return request<HealthResponse>('/api/health')
}

// 사진 한 장을 보내 식물 후보를 최대 3개 받음
export function identifyPlant(
  image: Blob,
  organ: PlantOrgan = 'auto',
  signal?: AbortSignal,
) {
  const form = new FormData()
  form.append('image', image, image instanceof File ? image.name : 'plant.jpg')
  if (organ !== 'auto') form.append('organ', organ)

  // Content-Type은 브라우저가 boundary와 함께 자동으로 붙이므로 지정하지 않음
  return request<IdentifyResponseDto>('/api/identify', {
    method: 'POST',
    body: form,
    signal,
  })
}

export function saveObservation(
  input: CreateObservationInput,
  signal?: AbortSignal,
) {
  const form = new FormData()
  form.append('image', input.image)

  if (input.plantId != null) {
    form.append('plantId', String(input.plantId))
  }

  if (input.scientificName) form.append('scientificName', input.scientificName)
  if (input.genusName) form.append('genusName', input.genusName)
  if (input.displayName) form.append('displayName', input.displayName)
  if (input.identificationScore != null) {
    form.append('identificationScore', String(input.identificationScore))
  }
  if (input.identificationCandidates) {
    form.append(
      'identificationCandidates',
      JSON.stringify(input.identificationCandidates),
    )
  }

  return request<CreateObservationResponseDto>('/api/observations', {
    method: 'POST',
    body: form,
    signal,
  })
}

export function getCollection() {
  return request<CollectionResponseDto>('/api/collection')
}

export function getPlant(plantId: number) {
  return request<PlantDetailResponseDto>(`/api/plants/${plantId}`)
}

export function getProfile() {
  return request<ProfileResponse>('/api/profile')
}

export function updateProfile(input: UpdateProfileInput) {
  const form = new FormData()
  if (input.nickname !== undefined) form.append('nickname', input.nickname)
  if (input.avatar) form.append('avatar', input.avatar)

  return request<UpdateProfileResponse>('/api/profile', {
    method: 'PATCH',
    body: form,
  })
}

export function deleteAvatar() {
  return request<UpdateProfileResponse>('/api/profile/avatar', {
    method: 'DELETE',
  })
}

export function getActivities(limit = 3) {
  return request<ActivitiesResponseDto>(`/api/activities?limit=${limit}`)
}
