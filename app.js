const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');

const userRoute = require('./routes/user');
const movieHallRoute = require('./routes/movieHall');
const movieRoute = require('./routes/addMovie');
const bookingRoute = require('./routes/booking');
const mappingRoute = require('./routes/movieHallMapping');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

app.use('/', userRoute);
app.use('/', movieHallRoute);
app.use('/', movieRoute);
app.use('/', bookingRoute);
app.use('/', mappingRoute);

app.listen(process.env.PORT || 3000, function () {
  console.log('App running on port 3000 ..');
});
