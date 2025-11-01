// Import the Firebase SDKs (modular syntax)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1ocaAzyxStVLRa6qsYlE1CZnxMPI-UwA",
  authDomain: "weather-news-preyash.firebaseapp.com",
  projectId: "weather-news-preyash",
  storageBucket: "weather-news-preyash.firebasestorage.app",
  messagingSenderId: "482261629119",
  appId: "1:482261629119:web:fd7dbfb47b523373f0ae0a",
  measurementId: "G-B61D6KQ523"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
