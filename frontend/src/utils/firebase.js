import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FCM_API_KEY,
  authDomain:        import.meta.env.VITE_FCM_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FCM_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FCM_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FCM_APP_ID,
}

// Only initialise once
const getApp = () =>
  getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

const getMsg = () => getMessaging(getApp())

export const requestNotificationPermission = async () => {
  // Don't run if Firebase config is missing
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
    console.error('[FCM] Error:', err.message)
    return null
  }
}

export const onForegroundMessage = (callback) => {
  if (!import.meta.env.VITE_FCM_PROJECT_ID) return () => {}
  try {
    return onMessage(getMsg(), (payload) => {
      const body = payload.notification?.body
      if (body) callback(body)
    })
  } catch (err) {
    console.error('[FCM] onMessage error:', err.message)
    return () => {}
  }
}