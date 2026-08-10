export function ok<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function fail(message: string, status = 400, details?: unknown) {
  return Response.json(
    { success: false, error: { message, details } },
    { status },
  )
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return String(error)
}
