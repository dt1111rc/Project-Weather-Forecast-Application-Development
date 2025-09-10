const API_KEY = "140529b8e1fbfc2b6a289286e68c8141";

// Temperature unit toggle
let isCelsius = true;

// To track recent searches
let recentCities = [];

let lastWeatherData = null;

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("searchBtn");
const weatherInfo = document.getElementById("weatherInfo");
const toggleUnitBtn = document.getElementById("toggleUnit");
const forecastContainer = document.getElementById("forecast");
const recentCitiesDropdown = document.getElementById("recentCities");

function showError(message) {
  weatherInfo.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded shadow">${message}</div>`;
}
// Code snippet to fetch current weather data
async function fetchWeather(city) {
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  try {
    // Step 1: Geocoding lookup (no country code)
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    console.log("Fetching geocode:", geoUrl);
    const geoRes = await fetch(geoUrl);
    console.log("Geo status:", geoRes.status);
    const geoData = await geoRes.json();
    console.log("Geo data:", geoData);

    if (!geoData || !geoData.length) {
      throw new Error(`City "${city}" not found by geocoding`);
    }

    const { lat, lon, name, country } = geoData[0];
    console.log(`Resolved ${name}, ${country} -> lat=${lat}, lon=${lon}`);

    //For Current weather by coordinates
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    console.log("Fetching weather:", weatherUrl);
    const weatherRes = await fetch(weatherUrl);
    console.log("Weather status:", weatherRes.status);
    const weatherData = await weatherRes.json();
    console.log("Weather data:", weatherData);

    if (!weatherRes.ok) {
      throw new Error(weatherData?.message || "Weather fetch failed");
    }

    lastWeatherData = weatherData;
    displayWeather(weatherData);
    addToRecentCities(name);

    // To forecast by coordinates
    fetchForecastCoords(lat, lon);
  } catch (err) {
    console.error("fetchWeather error:", err);
    showError(`Error: ${err.message}`);
  }
}

async function fetchForecastCoords(lat, lon) {
  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    console.log("Fetching forecast:", forecastUrl);
    const res = await fetch(forecastUrl);
    console.log("Forecast status:", res.status);
    const data = await res.json();
    console.log("Forecast data:", data);

    if (!res.ok) {
      throw new Error(data?.message || "Forecast fetch failed");
    }

    displayForecast(data.list);
  } catch (err) {
    console.error("fetchForecastCoords error:", err);
    forecastContainer.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded shadow">Error loading forecast: ${err.message}</div>`;
  }
}



async function fetchForecast(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Forecast not available.");
    const data = await res.json();
    displayForecast(data.list);
  } catch (err) {
    forecastContainer.innerHTML = `<div class="p-4 bg-red-100 text-red-700 rounded shadow">Error loading forecast: ${err.message}</div>
    `;
  }
}

// Code snippet to display current weather
function displayWeather(data) {
  const baseTemp = data.main.temp;
  const displayTemp = isCelsius ? baseTemp : (baseTemp * 9) / 5 + 32;
  const unit = isCelsius ? "°C" : "°F";
  const condition = data.weather[0].main;

  weatherInfo.innerHTML = `<div class="p-4 bg-white rounded shadow">
    <h2 class="text-2xl font-semibold">${data.name}</h2>
    <p class="text-lg font-medium" id="current-temp">${displayTemp.toFixed(1)} ${unit} | ${condition}</p>
    <p>Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s</p>
  </div>`;


  // Code snippet to colorize temp text based on metric temp
  const tempEl = document.getElementById("current-temp");
  if (baseTemp > 35) tempEl.style.color = "red";
  else if (baseTemp < 15) tempEl.style.color = "blue";
  else tempEl.style.color = "";

  // Code snippet to implement custom alert
  if (baseTemp > 40) {
    weatherInfo.innerHTML += `
      <div class="mt-2 p-2 bg-yellow-200 text-yellow-800 rounded">
          Extreme heat warning: Stay hydrated and avoid prolonged sun exposure.
        </div>`;
  }

  // Code snippet for dynamic rainy background
  if (condition.toLowerCase().includes("rain")) {
    document.body.classList.add("bg-blue-200");
  } else {
    document.body.classList.remove("bg-blue-200");
  }

};
// Code snippet to display Forecast Cards 
function displayForecast(list) {
  forecastContainer.innerHTML = "";
  const daily = list.filter((_, idx) => idx % 8 === 0);
  daily.forEach((day) => {
    forecastContainer.innerHTML += `
      <div class="p-4 bg-gray-100 rounded shadow text-center">
        <p class="font-medium">${new Date(day.dt_txt).toLocaleDateString()}</p>
        <p> ${day.main.temp.toFixed(1)} °C</p>
        <p> ${day.wind.speed} m/s</p>
        <p> ${day.main.humidity}%</p>
      </div>
    `;
  });
}

// Code snippet to deal with recent cities management
function addToRecentCities(city) {
  if (!recentCities.includes(city)) {
    recentCities.push(city);
    updateRecentCitiesDropdown();
  }
}

function updateRecentCitiesDropdown() {
  recentCitiesDropdown.innerHTML = recentCities
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");
  recentCitiesDropdown.classList.remove("hidden");
}

// Code snippet to implement event listening
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
  else showError("Please enter a city name.");
});

cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

toggleUnitBtn.addEventListener("click", () => {
  isCelsius = !isCelsius;
  if (lastWeatherData) displayWeather(lastWeatherData);
});

recentCitiesDropdown.addEventListener("change", () => {
  const city = recentCitiesDropdown.value;
  if (city) fetchWeather(city);
});

// Code snippet to implement geolocation feature
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      )
        .then((res) => res.json())
        .then((data) => {
          lastWeatherData = data;
          displayWeather(data);
          if (data.name) fetchForecast(data.name);
        })
        .catch(() =>
          showError(
            "Unable to retrieve location-based weather. Please search manually."
          )
        );
    },
    () => {
      console.log("Geolocation denied or unavailable.");
    }
  );
}
