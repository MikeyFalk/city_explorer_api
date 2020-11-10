'use strict';

let weatherForecasts = [];

const express = require('express');
const cors = require('cors');
const env = require('env');
//const { response } = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/location', handleLocation);
app.get('/weather', handleWeather);

function handleWeather(req, res) {
  try {
    console.log('in handle weather');
    let weatherData = require('./data/weather.json');
    let cityWeather = req.query.city;

  
    if (cityWeather === '') { res.send({ status: 500, responseText: 'Sorry, something went wrong' }); }
    weatherData.data.map(element => {
      new WeatherLocation(cityWeather, element);
      console.log('element: ', element);

    });

    res.send(weatherForecasts);
  }
  catch (error) {
    console.error(error);
  }
}

function handleLocation(req, res) {
  try {
    let geoData = require('./data/location.json');
    let city = req.query.city;
    // Check to see if it's an empty string.  Throw 500 error if empty. throw new Error(500);
    if (city === '') { res.send({ status: 500, responseText: 'Sorry, something went wrong' }); }
    let locationData = new Location(city, geoData);
    res.send(locationData);
  }
  catch (error) {
    console.error('error', error);
  }
}
function WeatherLocation(city, weatherData) {
  this.search_query = city;
  this.time = weatherData.valid_date;
  this.forecast = weatherData.weather.description;
  console.log('time and forecast', this.time, this.forecast);
  weatherForecasts.push(this);

}
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function emptyString() {
  console.log('In emptyString');
  app.use((req, res) => {
    console.log('reqresanonymous');
    res.status(500).send('No Bueno');
  });

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

