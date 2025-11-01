// ✅ Firebase Config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyA...YourKey...",
  authDomain: "weather-news-preyash.firebaseapp.com",
  projectId: "weather-news-preyash",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🌦️ Weather + News API Keys
const WEATHER_API = "19ec2fa1a19cab1c3a71c777d184cbc3";
const NEWS_API = "444b7d9ede4f4b3882e776a0a6226725";

// 🌆 Elements
const cityInput = document.getElementById("cityInput");
const showBtn = document.getElementById("showBtn");
const saveBtn = document.getElementById("saveBtn");
const weatherEl = document.getElementById("weather");
const newsEl = document.getElementById("news");

// ⚙️ Fetch Weather
async function getWeather(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API}`
  );
  if (!res.ok) throw new Error("Weather fetch failed");
  return res.json();
}

// 📰 Fetch News
async function getNews(city) {
  const res = await fetch(
    `https://newsapi.org/v2/top-headlines?q=${city}&pageSize=5&apiKey=${NEWS_API}`
  );
  if (!res.ok) throw new Error("News fetch failed");
  return res.json();
}

// 💬 Display Weather
function showWeather(data) {
  weatherEl.innerHTML = `
    <h2>Weather in ${data.name}</h2>
    <p>${data.weather[0].description}, ${data.main.temp}°C</p>
  `;
}

// 💬 Display News
function showNews(data) {
  if (!data.articles || data.articles.length === 0) {
    newsEl.innerHTML = "<p>No news found.</p>";
    return;
  }
  newsEl.innerHTML =
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
}

// ⚡ Show both Weather + News
async function showAll(city) {
  if (!city) {
    alert("Please enter a city name");
    return;
  }
  try {
    weatherEl.innerHTML = "Loading weather...";
    newsEl.innerHTML = "Loading news...";
    const [weather, news] = await Promise.all([getWeather(city), getNews(city)]);
    showWeather(weather);
    showNews(news);
  } catch (err) {
    weatherEl.innerHTML = "<p>⚠️ Error loading data.</p>";
    console.error(err);
  }
}

// 💾 Save Favorite City in Firestore
async function saveFavorite(city) {
  if (!city) return alert("Please enter a city first!");
  await db.collection("userPrefs").doc("default").set({
    favoriteCity: city,
    updatedAt: new Date(),
  });
  alert("✅ Favorite city saved!");
}

// 📥 Load Favorite City from Firestore
async function loadFavorite() {
  const doc = await db.collection("userPrefs").doc("default").get();
  if (doc.exists) {
    cityInput.value = doc.data().favoriteCity;
    showAll(doc.data().favoriteCity);
  }
}

// 🔘 Button Actions
showBtn.addEventListener("click", () => showAll(cityInput.value.trim()));
saveBtn.addEventListener("click", () => saveFavorite(cityInput.value.trim()));

// 🚀 Load last favorite when app starts
loadFavorite();
