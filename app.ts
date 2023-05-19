
const inputElement = document.querySelector('#city') as HTMLInputElement;
const searchForm = document.querySelector('#search-form') as HTMLFormElement;
const resultsContainer = document.querySelector('.results-container') as HTMLDivElement;
const cityNameDiv = document.querySelector('.city-name') as HTMLDivElement;
const popup = document.querySelector('.popup') as HTMLDivElement;
const allowBtn = document.querySelector('#allow-btn') as HTMLButtonElement;
const denyBtn = document.querySelector('#deny-btn') as HTMLButtonElement;
const submitBtn = document.querySelector('#btn') as HTMLButtonElement;

let latitude: number;
let longitude: number;
let cityName: string;
let currentCity: string;

allowBtn.addEventListener('click', function () {
  popup.style.display = 'none';
  getWeatherByLocation();
});

denyBtn.addEventListener('click', function () {
  popup.style.display = 'none';
  searchForm.style.display = 'inherit';
});

const searchInput = (e: Event) => {
  e.preventDefault();
  cityName = (e.target as HTMLInputElement).value;
  const apiUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=en&format=json`
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        latitude = data.results[0].latitude;
        longitude = data.results[0].longitude;
        currentCity = data.results[0].name;
      }
    }).catch(error => console.error(error));
};

const getWeatherByLocation = () => {
  navigator.geolocation.getCurrentPosition(position => {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;

    fetchCityName(latitude, longitude)
      .then(cityName => {
        currentCity = cityName;
        return fetchWeatherData(latitude, longitude);
      })
      .then(data => {
        displayWeatherData(data);
      })
      .catch(error => {
        console.error(error);
      });
  });
};

const getWeather = (e: Event) => {
  e.preventDefault();
  if (latitude !== undefined && longitude !== undefined) {
    fetchWeatherData(latitude, longitude)
      .then(data => {
        displayWeatherData(data);
        resetInputAndCoordinates();
      })
      .catch(error => {
        console.error(error);
      });
  }
};

const fetchCityName = async (latitude: number, longitude: number) => {
  const apiUrl = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data.address.city;
};

const fetchWeatherData = async (latitude: number, longitude: number) => {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,cloudcover&current_weather=true&forecast_days=1&timezone=auto`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  return data;
};

interface WeatherData {
  current_weather: {
    time: string;
  }
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    cloudcover: number[];
  };
}

const displayWeatherData = (data: WeatherData) => {
  if (resultsContainer && cityNameDiv && inputElement) {
    resultsContainer.innerHTML = '';
    inputElement.classList.add('adjusted');
    submitBtn.classList.add('adjusted');
    resultsContainer.classList.add('show');
    cityNameDiv.classList.add('show1');

    const hour = new Date(data.current_weather.time)
    const currentHour = hour.getHours();

    let highestTemp = Number.NEGATIVE_INFINITY;
    let lowestTemp = Number.POSITIVE_INFINITY;

    for (let i = currentHour; i <= 23; i++) {
      for (let j = 0; j < data.hourly.time.length; j++) {
        const timestamp = new Date(data.hourly.time[j]);
        const timestampHour = timestamp.getHours();

        if (timestampHour === i) {
          resultsContainer.innerHTML += `<div class="results">${timestampHour}:00 ${data.hourly.temperature_2m[j]}° ${data.hourly.precipitation_probability[j]}%</div>`;
          const temperature = data.hourly.temperature_2m[j];
          highestTemp = Math.max(highestTemp, temperature);
          lowestTemp = Math.min(lowestTemp, temperature)

          if (timestampHour === currentHour) {
            const isDaytime = currentHour >= 6 && currentHour < 19;
            const isCloudy = data.hourly.cloudcover[j] >= 25;
            const skyType = isCloudy ? 'cloudy' : 'clear';
            const timeOfDay = isDaytime ? 'Day' : 'Night';

            cityNameDiv.innerHTML = `<div class="current-city">${(currentCity).toUpperCase()}</div> Current temperature ${data.hourly.temperature_2m[j]}° with ${skyType} skies`;
            searchForm.style.backgroundImage = `url('./images/${skyType}${timeOfDay}.jpg')`;
          }
        }
      }
    }
    cityNameDiv.innerHTML += `<div>Highest temperature today ${highestTemp}° and lowest ${lowestTemp}° </div>`
  }
};

const resetInputAndCoordinates = () => {
  if (inputElement) {
    inputElement.value = '';
  }
  latitude;
  longitude;
};

if (searchForm) {
  searchForm.addEventListener('submit', getWeather)
};

if (inputElement) {
  inputElement.addEventListener('input', searchInput);
}


