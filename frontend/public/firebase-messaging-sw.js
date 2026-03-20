// Firebase service worker — handles push notifications when app is closed
// Fill in your actual Firebase config values — service workers cannot read env vars

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            'YOUR_VITE_FCM_API_KEY',
  authDomain:        'YOUR_VITE_FCM_AUTH_DOMAIN',
  projectId:         'YOUR_VITE_FCM_PROJECT_ID',
  messagingSenderId: 'YOUR_VITE_FCM_MESSAGING_SENDER_ID',
  appId:             'YOUR_VITE_FCM_APP_ID',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title = 'Society Gym', body = '' } = payload.notification || {}
  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  })
})
