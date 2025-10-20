importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);

const defaultConfig = {
  apiKey: "AIzaSyB9KQJNmfvQorXZHC57w90TxrswvmKARmM",
  authDomain: "wayjet-bbbac.firebaseapp.com",
  projectId: "wayjet-bbbac",
  storageBucket: "wayjet-bbbac.firebasestorage.app",
  messagingSenderId: "1035773008541",
  appId: "1:1035773008541:web:f3576c175bbad7a2fdd274",
  measurementId: "G-YYG5R5NQP7"
};

firebase.initializeApp(defaultConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);

  const notificationTitle = payload?.notification?.title || "Thông báo";
  const notificationOptions = {
    type: payload?.notification?.type || "message",
    body: payload?.notification?.body || "",
    icon: payload?.notification?.icon || "/favicon.png",
    requireInteraction: false,
    tag: String(Date.now()),
    data: payload?.data || {},
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

  setTimeout(async () => {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(n => n.close());
    notifications.forEach(n => n.clear());
  }, 5000);
});