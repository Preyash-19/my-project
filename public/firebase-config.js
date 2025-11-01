// Import the Firebase SDK functions you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase web app configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg...",
  authDomain: "weather-news-preyash.firebaseapp.com",
  projectId: "weather-news-preyash",
  storageBucket: "weather-news-preyash.appspot.com",
  messagingSenderId: "482261629119",
  appId: "1:482261629119:web:abcd1234efgh5678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
