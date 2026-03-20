import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging, Unsubscribe } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FCM_API_KEY,
  authDomain:        import.meta.env.VITE_FCM_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FCM_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FCM_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FCM_APP_ID,
}

const getApp = (): FirebaseApp =>
  getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

const getMsg = (): Messaging => getMessaging(getApp())

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!import.meta.env.VITE_FCM_PROJECT_ID) {
    console.warn('[FCM] Firebase config missing — skipping notification setup')
    return null
  }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(getMsg(), {
      vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
    })
    console.log('[FCM] Token:', token?.slice(0, 20) + '...')
    return token
  } catch (err) {
    console.error('[FCM] Error:', (err as Error).message)
    return null
  }
}

export const onForegroundMessage = (callback: (body: string) => void): Unsubscribe => {
  if (!import.meta.env.VITE_FCM_PROJECT_ID) return () => {}
  try {
    return onMessage(getMsg(), (payload) => {
      const body = payload.notification?.body
      if (body) callback(body)
    })
  } catch (err) {
    console.error('[FCM] onMessage error:', (err as Error).message)
    return () => {}
  }
}
