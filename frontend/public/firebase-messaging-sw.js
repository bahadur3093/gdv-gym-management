// Firebase service worker — handles push notifications when app is closed
// This file must be named firebase-messaging-sw.js and live in /public

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js')

// These values are replaced at build time via vite-plugin-pwa
// For now we use self.__WB_MANIFEST as a placeholder
firebase.initializeApp({
  apiKey:            self.VITE_FCM_API_KEY            || '',
  authDomain:        self.VITE_FCM_AUTH_DOMAIN        || '',
  projectId:         self.VITE_FCM_PROJECT_ID         || '',
  messagingSenderId: self.VITE_FCM_MESSAGING_SENDER_ID || '',
  appId:             self.VITE_FCM_APP_ID             || '',
})

const messaging = firebase.messaging()

// Handle background messages — shows native OS notification
messaging.onBackgroundMessage((payload) => {
  const { title = 'Society Gym', body = '' } = payload.notification || {}

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  })
})