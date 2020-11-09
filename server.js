'use strict';

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
    let weatherObj = new WeatherLocation(cityWeather, weatherData);
    res.send(weatherObj);
  }
  catch (error) {
    console.error(error);
  }
}

function WeatherLocation(city, weatherData) {
  this.search_query = city;
  this.time = weatherData.data[0].valid_date;
  this.forecast = weatherData.data[0].weather;
  console.log('time and forecast', this.time, this.forecast);
}

function handleLocation(req, res) {
  try {
    let geoData = require('./data/location.json');
    let city = req.query.city;
    let locationData = new Location(city, geoData);
    res.send(locationData);
  }
  catch (error) {
    console.error(error);
  }
}
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

//404 Handler
app.use('*', (req, res) => {
  res.status(404).send('Sorry, that does not exist.  Try again.');
});

app.listen(PORT, () => {
  console.log(`Server is working on ${PORT}`);
});

