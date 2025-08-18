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

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/icon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
