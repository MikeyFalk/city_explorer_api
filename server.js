'use strict';

let weatherForecasts = [];
let cityCoord = [];

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const superagent = require('superagent');
dotenv.config();

//const { response } = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

app.use(cors());

app.get('/location', handleLocation);
app.get('/weather', handleWeather);

function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
  cityCoord.push(this.latitude, this.longitude);
  console.log('geoData:', this);
}

function WeatherLocation(weatherData) {
  //this.search_query = city;
  this.time = weatherData.valid_date;
  this.forecast = weatherData.weather.description;
  // console.log('time and forecast', this.time, this.forecast);
  weatherForecasts.push(this);
}

function handleLocation(req, res) {
  try {
    let city = req.query.city;
    console.log(GEOCODE_API_KEY);
    let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;
    // Check to see if it's an empty string.  Throw 500 error if empty. throw new Error(500);
    if (city === '') { res.send({ status: 500, responseText: 'Sorry, something went wrong' }); }
    superagent.get(url)
      .then(data => {
        console.log(data.body[0]);
        let locationData = new Location(city, data.body[0]);
        res.send(locationData);
      })
      .catch(console.log('unable to access requested data'));
  }
  catch (error) {
    console.error('error', error);
  }
}

function handleWeather(req, res) {
  try {
    //console.log('in handle weather', locationData.latitude, locationData.longitude);
    console.log('city coord:', cityCoord);
    let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${cityCoord[0]}&lon=${cityCoord[1]}&key=${WEATHER_API_KEY}`;
    console.log(weatherUrl);
    superagent.get(weatherUrl)
      .then(weatherData => {
        weatherData.body.data.map(element => {
          new WeatherLocation(element);
        });
        console.log(weatherForecasts.length);
        res.send(weatherForecasts);
      });
  }
  catch (error) {
    console.error(error);
  }
}

// 500 error
app.use((error, req, res, next) => {
  console.log('ERROR!!!', error.status);
  res.status(error.status || 500).send({
    error: {
      status: error.status || 500,
      message: error.message || 'Internal Server Error',
    },
  });
});

//404 Handler
app.use('*', (req, res) => {
  res.status(404).send('Sorry, that does not exist.  Try again.');
});
//function that take in the response object through it's response throught it params and sets the 500 status.  log out message.
app.listen(PORT, () => {
  console.log(`Server is working on ${PORT}`);
});

