const NAME_STORAGE_KEY = "daylight-name";
const nameForm = document.querySelector("#name-form");
const nameInput = document.querySelector("#name-input");
const greetingName = document.querySelector("#greeting-name");
const nameSaveStatus = document.querySelector("#name-save-status");
const CITY_STORAGE_KEY = "daylight-location";
const UNIT_STORAGE_KEY = "daylight-unit";
// Open-Meteo uses WMO weather codes; these entries turn them into readable labels and icons.
const weatherCodes = {
	0: { description: "Clear sky", icon: "☀" },
	1: { description: "Mostly clear", icon: "🌤" },
	2: { description: "Partly cloudy", icon: "⛅" },
	3: { description: "Overcast", icon: "☁" },
	45: { description: "Foggy", icon: "≋" },
	48: { description: "Rime fog", icon: "≋" },
	51: { description: "Light drizzle", icon: "☂" },
	53: { description: "Drizzle", icon: "☂" },
	55: { description: "Heavy drizzle", icon: "☂" },
	56: { description: "Freezing drizzle", icon: "❄" },
	57: { description: "Freezing drizzle", icon: "❄" },
	61: { description: "Light rain", icon: "☂" },
	63: { description: "Rain", icon: "☂" },
	65: { description: "Heavy rain", icon: "☂" },
	66: { description: "Freezing rain", icon: "❄" },
	67: { description: "Freezing rain", icon: "❄" },
	71: { description: "Light snow", icon: "❄" },
	73: { description: "Snow", icon: "❄" },
	75: { description: "Heavy snow", icon: "❄" },
	77: { description: "Snow grains", icon: "❄" },
	80: { description: "Light showers", icon: "☂" },
	81: { description: "Rain showers", icon: "☂" },
	82: { description: "Heavy showers", icon: "☂" },
	85: { description: "Snow showers", icon: "❄" },
	86: { description: "Heavy snow showers", icon: "❄" },
	95: { description: "Thunderstorm", icon: "⚡" },
	96: { description: "Thunder & hail", icon: "⚡" },
	99: { description: "Thunder & hail", icon: "⚡" },
};
let selectedUnit = "celsius";
let activeWeatherRequest = 0;

// Restore the unit preference before rendering any temperatures.
try {
	selectedUnit = localStorage.getItem(UNIT_STORAGE_KEY) === "fahrenheit" ? "fahrenheit" : "celsius";
} catch {
	selectedUnit = "celsius";
}

try {
	const savedName = localStorage.getItem(NAME_STORAGE_KEY)?.trim();
	if (savedName) {
		nameInput.value = savedName;
		greetingName.textContent = savedName;
	}
} catch {
	nameSaveStatus.textContent = "Name saving is unavailable in this browser.";
}

nameForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const name = nameInput.value.trim();
	if (!name) {
		nameSaveStatus.textContent = "Enter a name first.";
		nameInput.focus();
		return;
	}

	nameInput.value = name;
	greetingName.textContent = name;
	try {
		localStorage.setItem(NAME_STORAGE_KEY, name);
		nameSaveStatus.textContent = "Name saved.";
	} catch {
		nameSaveStatus.textContent = "Name updated, but could not be saved.";
	}
});

function updateClock() {
	const now = new Date();
	const hour = now.getHours();
	const greeting = hour >= 5 && hour < 12 ? "Good morning" : hour < 18 && hour >= 12 ? "Good afternoon" : "Good evening";
	document.querySelector("#greeting").firstChild.textContent = `${greeting}, `;

	const clockTime = document.querySelector("#clock-time");
	clockTime.textContent = new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	}).format(now);
	clockTime.dateTime = now.toISOString();

	const dateFormat = { weekday: "long", month: "long", day: "numeric" };
	document.querySelector("#clock-date").textContent = new Intl.DateTimeFormat(undefined, dateFormat).format(now);
	document.querySelector("#header-date").textContent = new Intl.DateTimeFormat(undefined, {
		...dateFormat,
		year: "numeric",
	}).format(now);
	document.querySelector("#footer-year").textContent = `© ${now.getFullYear()} Daylight`;
}

updateClock();
window.setInterval(updateClock, 1000);

function formatTemperature(celsius) {
	// Open-Meteo returns Celsius by default, so convert only when Fahrenheit is selected.
	const value = selectedUnit === "fahrenheit" ? celsius * 9 / 5 + 32 : celsius;
	return `${Math.round(value)}°`;
}

function renderWeather(data, location) {
	const current = data.current;
	const today = data.daily;
	const condition = weatherCodes[current.weather_code] || { description: "Changeable skies", icon: "☁" };
	document.querySelector("#weather-symbol").textContent = condition.icon;
	document.querySelector("#weather-temperature").textContent = formatTemperature(current.temperature_2m);
	document.querySelector("#weather-description").textContent = condition.description;
	document.querySelector("#weather-place").textContent = location.name;
	document.querySelector("#feels-like").textContent = formatTemperature(current.apparent_temperature);
	document.querySelector("#wind-speed").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
	document.querySelector("#high-low").textContent = `${formatTemperature(today.temperature_2m_max[0])} / ${formatTemperature(today.temperature_2m_min[0])}`;

	const forecastList = document.querySelector("#forecast-list");
	forecastList.replaceChildren();
	today.time.forEach((date, index) => {
		const day = document.createElement("div");
		day.className = "forecast-day";
		const dateLabel = document.createElement("span");
		dateLabel.textContent = index === 0 ? "Today" : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${date}T12:00:00`));
		const icon = document.createElement("span");
		icon.setAttribute("aria-hidden", "true");
		icon.textContent = (weatherCodes[today.weather_code[index]] || { icon: "☁" }).icon;
		const temperatures = document.createElement("strong");
		temperatures.append(document.createTextNode(`${formatTemperature(today.temperature_2m_max[index])} `));
		const low = document.createElement("span");
		low.textContent = formatTemperature(today.temperature_2m_min[index]);
		temperatures.append(low);
		day.append(dateLabel, icon, temperatures);
		forecastList.append(day);
	});
}

async function loadWeather(location, requestId = ++activeWeatherRequest) {
	const description = document.querySelector("#weather-description");
	description.textContent = "Loading the forecast...";
	try {
		// Ask for current conditions and three daily high/low forecasts for these coordinates.
		const params = new URLSearchParams({
			latitude: location.latitude,
			longitude: location.longitude,
			current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
			daily: "weather_code,temperature_2m_max,temperature_2m_min",
			forecast_days: "3",
			timezone: "auto",
		});
		const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
		if (!response.ok) throw new Error("Weather data is unavailable right now.");
		const data = await response.json();
		// Ignore an older response if the user has already searched for another city.
		if (requestId !== activeWeatherRequest) return;
		if (!data.current || !data.daily || data.daily.time.length < 3) throw new Error("The forecast could not be read.");
		renderWeather(data, location);
		try {
			localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(location));
		} catch {
			description.textContent = "Forecast loaded, but this browser could not save the city.";
		}
	} catch (error) {
		if (requestId !== activeWeatherRequest) return;
		description.textContent = error instanceof TypeError ? "Unable to connect. Check your internet." : error.message;
	}
}

async function searchCity(cityName) {
	const requestId = ++activeWeatherRequest;
	const description = document.querySelector("#weather-description");
	description.textContent = "Finding your city...";
	try {
		// Geocoding converts the typed city name into the coordinates the forecast API needs.
		const params = new URLSearchParams({ name: cityName, count: "1", language: "en", format: "json" });
		const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
		if (!response.ok) throw new Error("City search is unavailable right now.");
		const result = await response.json();
		if (requestId !== activeWeatherRequest) return;
		const match = result.results?.[0];
		if (!match) throw new Error("No city found. Try another name.");
		const location = {
			name: [match.name, match.country].filter(Boolean).join(", "),
			latitude: match.latitude,
			longitude: match.longitude,
		};
		document.querySelector("#city-input").value = match.name;
		await loadWeather(location, requestId);
	} catch (error) {
		if (requestId === activeWeatherRequest) {
			description.textContent = error instanceof TypeError ? "Unable to connect. Check your internet." : error.message;
		}
	}
}

document.querySelector("#city-form").addEventListener("submit", (event) => {
	event.preventDefault();
	const cityName = document.querySelector("#city-input").value.trim();
	if (cityName) searchCity(cityName);
});

document.querySelector("#location-button").addEventListener("click", () => {
	const description = document.querySelector("#weather-description");
	if (!navigator.geolocation) {
		description.textContent = "Location is not available in this browser. Search for a city instead.";
		return;
	}
	description.textContent = "Finding your location...";
	const requestId = ++activeWeatherRequest;
	navigator.geolocation.getCurrentPosition(
		({ coords }) => loadWeather({ name: "Your location", latitude: coords.latitude, longitude: coords.longitude }, requestId),
		() => {
			if (requestId === activeWeatherRequest) description.textContent = "Location unavailable. Search for a city instead.";
		},
		{ timeout: 10000, maximumAge: 300000 },
	);
});

document.querySelectorAll(".unit-button").forEach((button) => {
	const active = button.dataset.unit === selectedUnit;
	button.classList.toggle("is-active", active);
	button.setAttribute("aria-pressed", String(active));
	button.addEventListener("click", () => {
		selectedUnit = button.dataset.unit;
		document.querySelectorAll(".unit-button").forEach((unitButton) => {
			const isSelected = unitButton.dataset.unit === selectedUnit;
			unitButton.classList.toggle("is-active", isSelected);
			unitButton.setAttribute("aria-pressed", String(isSelected));
		});
		try {
			localStorage.setItem(UNIT_STORAGE_KEY, selectedUnit);
		} catch {
			return;
		}
		// Reload the saved location so every temperature is reformatted in the chosen unit.
		const savedLocation = getSavedLocation();
		if (savedLocation) loadWeather(savedLocation);
	});
});

function getSavedLocation() {
	try {
		const location = JSON.parse(localStorage.getItem(CITY_STORAGE_KEY));
		return location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude) ? location : null;
	} catch {
		return null;
	}
}

const requestedCity = new URLSearchParams(window.location.search).get("city");
const savedLocation = getSavedLocation();
// A city in the URL takes priority; otherwise restore the last city or start with Kampala.
if (requestedCity) {
	document.querySelector("#city-input").value = requestedCity;
	searchCity(requestedCity);
} else if (savedLocation) {
	document.querySelector("#city-input").value = savedLocation.name === "Your location" ? "" : savedLocation.name.split(",")[0];
	loadWeather(savedLocation);
} else {
	searchCity("Kampala");
}