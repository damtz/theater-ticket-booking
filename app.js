const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');

const userRoute = require('./controller/user');
const movieHallRoute = require('./controller/movieHall');
const movieRoute = require('./controller/addMovie');
const bookingRoute = require('./controller/booking');
const mappingRoute = require('./controller/movieHallMapping');
const addUserRoute = require('./controller/addUser');
const superRoute = require('./controller/superAdmin');
const adminRoute = require('./controller/admin');
const addreviewRoute = require('./controller/moviereview');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/assets', express.static('assets'));
app.use('/public', express.static('public'));
const flash = require('express-flash');

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);
//
app.use(flash());
app.use('', userRoute);
app.use('', movieHallRoute);
app.use('', movieRoute);
app.use('', bookingRoute);
app.use('', mappingRoute);
app.use('', addUserRoute);
app.use('', superRoute);
app.use('', adminRoute);
app.use('', addreviewRoute);

app.listen(process.env.PORT || 3000, function () {
  console.log('App running on port 3000 ..');
});
