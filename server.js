'use strict';

let weatherForecasts = [];
let cityCoord = [];
let trailArray = [];

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const superagent = require('superagent');
const pg = require('pg');
dotenv.config();


//const { response } = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);

app.use(cors());

app.get('/location', checkDatabase);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);


app.get('/add', (req, res) => {

  let SQL = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *';
  client.query(SQL, makeQueryString(req))
    .then(results => {
      console.log('location rows:', results.rows);
      res.status(201).json(results.rows);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

function makeQueryString(obj) {
  let array = [obj.query.search, obj.query.fquery, obj.query.lat, obj.query.long];
  return (array)
}




function Location(city, geoData) {
  console.log('GEODATA: ', geoData);
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
  cityCoord.push(this.latitude, this.longitude);

  console.log('THIS!!!: ', this);
}

function WeatherLocation(weatherData) {
  //this.search_query = city;
  this.time = weatherData.valid_date;
  this.forecast = weatherData.weather.description;
  // console.log('time and forecast', this.time, this.forecast);
  weatherForecasts.push(this);
}

function Trails(trailData) {
  this.name = trailData.name;
  this.location = trailData.location;
  this.length = trailData.length;
  this.stars = trailData.stars;
  this.stars_votes = trailData.stars_votes;
  this.summary = trailData.summary;
  this.trail_url = trailData.trail_url;
  this.conditions = trailData.conditions;
  this.condition_date = trailData.conditions_date;
  this.condition_time = trailData.condition_time;
  trailArray.push(this);

}
function handleLocation(req, res) {
  try {
    let city = req.query.city;

    let url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;
    // Check to see if it's an empty string.  Throw 500 error if empty. throw new Error(500);
    // if (city === '') { res.send({ status: 500, responseText: 'Sorry, something went wrong' }); }
    superagent.get(url)
      .then(data => {
        console.log(data.body[0]);

        addToSql(city, data.body[0]);

        let locationData = new Location(city, data.body[0]);
        res.send(locationData);
      });
    // .catch(console.log('unable to access requested data'));
  }
  catch (error) {
    console.error('error', error);
  }
}

function handleWeather(req, res) {
  try {
    //console.log('in handle weather', locationData.latitude, locationData.longitude);

    let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${cityCoord[0]}&lon=${cityCoord[1]}&key=${WEATHER_API_KEY}`;

    superagent.get(weatherUrl)
      .then(weatherData => {
        weatherData.body.data.map(element => {
          new WeatherLocation(element);
        });

        res.send(weatherForecasts);
      });
  }
  catch (error) {
    console.error(error);
  }
}

function handleTrails(req, res) {
  try {
    let trailsUrl = `https://www.hikingproject.com/data/get-trails?lat=${cityCoord[0]}&lon=${cityCoord[1]}&maxDistance=30&key=${TRAIL_API_KEY}`;
    superagent.get(trailsUrl)
      .then(trailsData => {

        trailsData.body.trails.map(element => {
          new Trails(element);
        });
        res.send(trailArray);
      });

  }
  catch (error) {
    console.error('trails error', error);
  }
}

function checkDatabase(req, res) {

  let locationQuery = `SELECT DISTINCT * FROM locations WHERE  search_query = '${req.query.city}'`;
  console.log('locationQuery!:', locationQuery);
  client.query(locationQuery).then(data => {

    let city = data.rows[0].search_query;
    console.log('city', city, '\t data.rows[0]', data.rows[0])
    let geoData = {
      display_name: data.rows[0].formatted_query,
      lat: data.rows[0].latitude,
      lon: data.rows[0].longitude
    };
    let locationData = new Location(city, geoData);
    res.send(locationData);
  })
    .catch(err => {
      console.log('Shit\'s Wack');
      handleLocation(req, res);
    });
}

function addToSql(city, dataObj) {


  let SQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *`;

  let values = [city, dataObj.display_name, dataObj.lat, dataObj.lon];

  client.query(SQL, values)
    .then(results => {
      console.log('location rows:', results.rows);
    })
    .catch(err => {
      console.log('Couldn\'t add to the database!  For some wierd reason', err);
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

client.connect()
  .then(() => {
    console.log('connected hurray');
    app.listen(PORT, () => {
      console.log(`Server is working on ${PORT}`);
    });
  })
  .catch(err => console.log(err));
