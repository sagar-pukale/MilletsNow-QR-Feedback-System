export type FeedbackLocationPayload = {
  latitude?: number
  longitude?: number
  locationAccuracy?: number
}

export async function collectFeedbackLocation() {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return { status: 'unavailable' as const, payload: {} satisfies FeedbackLocationPayload }
  }

  try {
    if ('permissions' in navigator && navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      if (permission.state === 'denied') {
        return { status: 'denied' as const, payload: {} satisfies FeedbackLocationPayload }
      }
    }
  } catch {
    // Permission API is optional; fall back to requesting location once.
  }

  return new Promise<{ status: 'granted' | 'denied' | 'unavailable'; payload: FeedbackLocationPayload }>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: 'granted',
          payload: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationAccuracy: position.coords.accuracy,
          },
        })
      },
      (error) => {
        resolve({
          status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
          payload: {},
        })
      },
      {
        enableHighAccuracy: false,
        maximumAge: 0,
        timeout: 8000,
      },
    )
  })
}
