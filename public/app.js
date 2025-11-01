// Import Firebase modules
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// API Keys
const WEATHER_API = "19ec2fa1a19cab1c3a71c777d184cbc3";
const NEWS_API = "444b7d9ede4f4b3882e776a0a6226725";

document.addEventListener("DOMContentLoaded", () => {
  // Show loading state
  const loading = document.createElement('div');
  loading.id = 'loading';
  loading.innerHTML = 'Loading...';
  document.body.appendChild(loading);

  // Check current page
  const isLoginPage = window.location.pathname.includes('login.html');
  
  // Initialize auth state listener
  onAuthStateChanged(auth, (user) => {
    if (isLoginPage) {
      if (user) {
        window.location.href = '/index.html';
      } else {
        setupLoginPage();
      }
    } else {
      if (!user) {
        window.location.href = '/login.html';
      } else {
        setupMainApp(user);
      }
    }
    loading.remove();
  });
});

function setupLoginPage() {
  const elements = {
    loginBtn: document.getElementById("loginBtn"),
    signupBtn: document.getElementById("signupBtn"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    message: document.getElementById("message")
  };

  // Validate elements exist
  if (!elements.loginBtn || !elements.signupBtn || !elements.email || !elements.password) {
    console.error('Required login elements not found');
    return;
  }

  if (elements.loginBtn) {
    elements.loginBtn.addEventListener("click", async () => {
      const email = elements.email?.value?.trim();
      const password = elements.password?.value?.trim();
      if (!email || !password) return alert("Enter email and password!");

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = '/index.html';
      } catch (error) {
        elements.message.innerText = error.message;
      }
    });
  }

  if (elements.signupBtn) {
    elements.signupBtn.addEventListener("click", async () => {
      const email = elements.email?.value?.trim();
      const password = elements.password?.value?.trim();
      if (!email || !password) return alert("Enter email and password!");

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = '/index.html';
      } catch (error) {
        elements.message.innerText = error.message;
      }
    });
  }
}

function setupMainApp(user) {
  const elements = {
    cityInput: document.getElementById("cityInput"),
    showBtn: document.getElementById("showBtn"),
    saveBtn: document.getElementById("saveBtn"),
    weatherEl: document.getElementById("weather"),
    newsEl: document.getElementById("news"),
    logoutBtn: document.getElementById("logoutBtn"),
    favorites: document.getElementById("favorites")
  };

  // Validate elements exist
  if (!elements.cityInput || !elements.showBtn || !elements.weatherEl || !elements.newsEl) {
    console.error('Required main app elements not found');
    return;
  }

  // Weather & News API Functions
  const api = {
    async getWeather(city) {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API}`
      );
      if (!res.ok) throw new Error("Weather not found");
      return res.json();
    },
    async getNews(city) {
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?q=${city}&pageSize=5&apiKey=${NEWS_API}`
      );
      if (!res.ok) throw new Error("News not found");
      return res.json();
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
        alert("Please enter a city name!");
        return;
      }
      elements.weatherEl.innerHTML = "Loading weather...";
      elements.newsEl.innerHTML = "Loading news...";
      try {
        const [weather, news] = await Promise.all([
          this.getWeather(city),
          this.getNews(city)
        ]);
        this.showWeather(weather);
        this.showNews(news);
      } catch (error) {
        console.error("Error loading data:", error);
        elements.weatherEl.innerHTML = "<p>⚠️ Error loading data.</p>";
      }
    }
  };

  // Firestore helpers
  const dbOps = {
    async saveFavorite(city) {
      if (!city) return alert("Please enter a city first!");
      
      try {
        elements.saveBtn.disabled = true;
        await addDoc(collection(db, "favorites"), {
          uid: user.uid,
          city,
          timestamp: new Date()
        });
        alert("✅ Favorite city saved!");
        await this.loadFavorites();
      } catch (error) {
        console.error("Error saving favorite:", error);
        alert("Failed to save favorite");
      } finally {
        elements.saveBtn.disabled = false;
      }
    },

    async loadFavorites() {
      try {
        elements.favorites.innerHTML = 'Loading favorites...';
        const q = query(collection(db, "favorites"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);

        const cities = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        elements.favorites.innerHTML = cities.length ? 
          `<h3>Your Favorite Cities:</h3>
           <ul>${cities.map(city => `<li>${city.city}</li>`).join('')}</ul>` :
          '<p>No favorite cities saved yet</p>';
      } catch (error) {
        console.error("Error loading favorites:", error);
        elements.favorites.innerHTML = '<p>Error loading favorites</p>';
      }
    }
  };

  // Event Listeners with Error Handling
  elements.showBtn.addEventListener("click", async () => {
    const city = elements.cityInput.value.trim();
    elements.showBtn.disabled = true;
    try {
      await api.showAll(city);
    } finally {
      elements.showBtn.disabled = false;
    }
  });

  elements.saveBtn?.addEventListener("click", () => 
    dbOps.saveFavorite(elements.cityInput.value.trim())
  );

  elements.logoutBtn?.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout");
    }
  });

  // Load initial data
  dbOps.loadFavorites();
}
