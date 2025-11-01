import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// API Keys
const WEATHER_API = "19ec2fa1a19cab1c3a71c777d184cbc3";
const NEWS_API = "444b7d9ede4f4b3882e776a0a6226725";

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const elements = {
    cityInput: document.getElementById("cityInput"),
    showBtn: document.getElementById("showBtn"),
    saveBtn: document.getElementById("saveBtn"),
    weatherEl: document.getElementById("weather"),
    newsEl: document.getElementById("news"),
    signupBtn: document.getElementById("signupBtn"),
    loginBtn: document.getElementById("loginBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    message: document.getElementById("message"),
    authSection: document.getElementById("authSection"),
    authRequired: document.querySelector(".auth-required"),
    loginForm: document.querySelector(".login-form"),
    favorites: document.getElementById("favorites")
  };

  // Weather and News Functions
  const api = {
    async getWeather(city) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API}`
        );
        if (!res.ok) throw new Error(`Weather API Error: ${res.statusText}`);
        return res.json();
      } catch (error) {
        console.error("Weather fetch error:", error);
        throw error;
      }
    },
    async getNews(city) {
      try {
        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?q=${city}&pageSize=5&apiKey=${NEWS_API}`
        );
        if (!res.ok) throw new Error(`News API Error: ${res.statusText}`);
        return res.json();
      } catch (error) {
        console.error("News fetch error:", error);
        throw error;
      }
    },
    showWeather(data) {
      elements.weatherEl.innerHTML = `
        <h2>Weather in ${data.name}</h2>
        <p>${data.weather[0].description}, ${data.main.temp}°C</p>
      `;
    },
    showNews(data) {
      if (!data.articles || data.articles.length === 0) {
        elements.newsEl.innerHTML = "<p>No news found.</p>";
        return;
      }
      elements.newsEl.innerHTML =
        "<h2>Top Headlines</h2>" +
        data.articles
          .map(
            (a) => `
          <article>
            <h3><a href="${a.url}" target="_blank">${a.title}</a></h3>
            <p>${a.source.name} – ${a.publishedAt.split("T")[0]}</p>
          </article>`
          )
          .join("");
    },
    async showAll(city) {
      if (!city) {
        alert("Please enter a city name");
        return;
      }
      try {
        elements.weatherEl.innerHTML = "Loading weather...";
        elements.newsEl.innerHTML = "Loading news...";
        const [weather, news] = await Promise.all([this.getWeather(city), this.getNews(city)]);
        this.showWeather(weather);
        this.showNews(news);
      } catch (err) {
        elements.weatherEl.innerHTML = "<p>⚠️ Error loading data.</p>";
        console.error(err);
      }
    }
  };

  // Firestore Functions
  const db = {
    async saveFavorite(city) {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first!");
        return;
      }
      if (!city) {
        alert("Please enter a city first!");
        return;
      }

      try {
        await addDoc(collection(db, "favorites"), {
          uid: user.uid,
          city: city,
          timestamp: new Date()
        });
        alert("✅ Favorite city saved!");
      } catch (error) {
        console.error("Error saving favorite:", error);
        alert("Failed to save. Try again.");
      }
    },
    async loadFavorites() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(collection(db, "favorites"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        let list = "<h3>Your Favorite Cities:</h3><ul>";
        querySnapshot.forEach((doc) => {
          list += `<li>${doc.data().city}</li>`;
        });
        list += "</ul>";

        elements.favorites.innerHTML = list;
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }
  };

  // Auth state observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Logged in:", user.email);
      db.loadFavorites();
      elements.authRequired?.style.display = 'block';
      elements.loginForm?.style.display = 'none';
      elements.authSection?.style.display = 'none';
    } else {
      console.log("No user logged in");
      elements.authRequired?.style.display = 'none';
      elements.loginForm?.style.display = 'block';
      elements.authSection?.style.display = 'block';
      elements.favorites && (elements.favorites.innerHTML = "");
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
    }
  });

  // Event Listeners
  const setupEventListeners = () => {
    elements.showBtn?.addEventListener("click", () => 
      api.showAll(elements.cityInput?.value?.trim())
    );
    
    elements.saveBtn?.addEventListener("click", () => 
      db.saveFavorite(elements.cityInput?.value?.trim())
    );

    elements.signupBtn?.addEventListener("click", async () => {
      try {
        const email = elements.email?.value?.trim();
        const password = elements.password?.value?.trim();
        if (!email || !password) return;
        
        await createUserWithEmailAndPassword(auth, email, password);
        elements.message.innerText = "Signup successful!";
        window.location.href = '/index.html';
      } catch (error) {
        elements.message.innerText = error.message;
      }
    });

    elements.loginBtn?.addEventListener("click", async () => {
      try {
        const email = elements.email?.value?.trim();
        const password = elements.password?.value?.trim();
        if (!email || !password) return;

        await signInWithEmailAndPassword(auth, email, password);
        elements.message.innerText = "Login successful!";
        window.location.href = '/index.html';
      } catch (error) {
        elements.message.innerText = error.message;
      }
    });

    elements.logoutBtn?.addEventListener("click", async () => {
      try {
        await signOut(auth);
        elements.message.innerText = "Logged out successfully!";
        window.location.href = '/login.html';
      } catch (error) {
        elements.message.innerText = error.message;
      }
    });
  };

  setupEventListeners();
});
