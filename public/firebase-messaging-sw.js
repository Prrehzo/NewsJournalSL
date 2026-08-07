importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDD75YDuvegRyuaglsNPsw5nO6b4rVSwSQ",
  authDomain: "newsjournalsl.firebaseapp.com",
  projectId: "newsjournalsl",
  storageBucket: "newsjournalsl.firebasestorage.app",
  messagingSenderId: "25470382079",
  appId: "1:25470382079:web:2aad0d43d8e710a6b8c1ca",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
