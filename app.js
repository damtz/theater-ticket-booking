const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer')


const userRoute = require('./controller/user');
const reviewRoute =  require('./controller/moviereview')
const movieHallRoute = require('./controller/movieHall');
const movieRoute = require('./controller/addMovie');
const bookingRoute = require('./controller/booking');
const mappingRoute = require('./controller/movieHallMapping');
const addUserRoute = require('./controller/addUser');
const addlanguageRoute = require('./controller/addlanguage');


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
app.use('/', addUserRoute);
app.use('/', reviewRoute);
app.use('/', addlanguageRoute);


app.listen(process.env.PORT || 3000, function () {
  console.log('App running on port 3000 ..');
});
