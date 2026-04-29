// Firebase Cloud Messaging — Service Worker (Background Messages)
// This file MUST be in /public/ root for FCM to work

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBtla9LqPG4V_m64zlY0R6psZD90g2FsvA",
  authDomain: "gr7-system.firebaseapp.com",
  projectId: "gr7-system",
  storageBucket: "gr7-system.firebasestorage.app",
  messagingSenderId: "922740877412",
  appId: "1:922740877412:web:e39c5d17d5022c7e839771",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Power Time', {
    body: body || '',
    icon: icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
  });
});
