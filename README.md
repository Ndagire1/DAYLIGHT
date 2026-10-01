# Daylight Dashboard

A responsive personal dashboard built with plain HTML, CSS, and JavaScript. It combines a live clock and weather with a name setting, daily habits, and a notes area.

## Features

- Live local time, date, and time-based greeting
- Current weather and a three-day forecast from Open-Meteo
- Search by city or request weather for your current location
- Celsius and Fahrenheit display
- Saves your name, preferred city, and temperature unit in this browser
- Responsive two-column desktop layout that stacks on smaller screens
- Habit tracker and daily notes interface (interactive saving is not implemented yet)

Weather and city search require an internet connection. Location lookup also requires browser permission.

## Project Files

- `index.html` - Dashboard structure and sample content
- `style.css` - Layout, colors, and responsive styling
- `script.js` - Clock, name setting, city lookup, and weather behavior

## Run Locally

Open `index.html` in a web browser. The weather section fetches live data from Open-Meteo; no API key is required.

## Publish with GitHub Pages

1. Create a GitHub repository and upload `index.html`, `style.css`, `script.js`, and this `README.md` to the repository root.
2. Open the repository's **Settings** and select **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/(root)` folder, then save.
5. When deployment finishes, open the site address shown in the Pages settings. It usually looks like `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Data and Privacy

The name, city, and temperature unit are saved in your browser's local storage. Weather requests use Open-Meteo's public forecast and geocoding services. A city search sends the city name to the geocoding service; the forecast request uses the selected location's coordinates.
