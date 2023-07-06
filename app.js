const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer')

require('dotenv').config();
const session = require('express-session');
const userRoute = require('./routes/user');
const movieHallRoute = require('./routes/movieHall');
const movieRoute = require('./routes/addMovie');
const addlanguageRoute = require('./routes/addlanguage');
const moviemappingRoute = require('./routes/movie_mapping');



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const storageEngine = multer.diskStorage({
  destination: "./images",
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}--${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
  ) {
      cb(null, true);
  } else {
      cb(null, false);
  }
};
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.urlencoded({ extended: true }))
app.use(multer({ storage: storageEngine, fileFilter: fileFilter }).single('image'))

app.use('/', userRoute);
app.use('/', movieHallRoute);
app.use('/', movieRoute);
app.use('/', addlanguageRoute);
app.use('/', moviemappingRoute);




app.listen(process.env.PORT || 3000, function () {
  console.log('App running on port 3000 ..');
});
