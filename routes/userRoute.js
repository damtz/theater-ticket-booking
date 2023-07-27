const express = require('express');
const app = express();

const userRoute = require('./controller/user');
// const movieHallRoute = require('./routes/movieHall');
// const movieRoute = require('./routes/addMovie');
// const bookingRoute = require('./routes/booking');
// const mappingRoute = require('./routes/movieHallMapping');

app.use('/', userRoute);

module.exports = router;
