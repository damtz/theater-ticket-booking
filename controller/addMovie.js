const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const fileUpload = require('express-fileupload');
app.use(fileUpload());
const multer = require('multer');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};
function ensuresuperadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'super-admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}
function ensureadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}

const errorMessage = [];

router.get('/addMovie', isLoggedin, ensureadmin, function (req, res) {
  const query = 'SELECT * FROM movie_halls';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    const Halls = results.map((row) => Object.assign({}, row));
    res.render('admin/addMovie', {
      Halls: Halls,
      currentUser: req.user,
      errorMessage: errorMessage,
    });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '_' + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post(
  '/super-addMovie',
  isLoggedin,
  ensuresuperadmin,
  upload.single('image'),
  function (req, res) {
    const { movieTitle, summary, casts, status, genre, duration } = req.body;
    const imageFileName = req.file.filename;

    // Check if movie with the given title already exists
    const checkMovieQuery = `SELECT * FROM movies WHERE title = '${movieTitle}'`;
    connection.query(checkMovieQuery, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length > 0) {
        req.flash('error', 'Movie with the given title already exists');
        return res.redirect('/super-addMovie'); // Use return to stop further execution
      } else {
        const insertMovieQuery = `INSERT INTO movies (title, summary, casts, status, genre, duration, image) VALUES 
        ('${movieTitle}', '${summary}', '${casts}', '${status}', '${genre}', '${duration}', '${imageFileName}')`;
        connection.query(insertMovieQuery, (error, results) => {
          if (error) {
            req.flash('error', 'Error Adding the movie');
            return res.redirect('/super-addMovie'); // Use return to stop further execution
          }

          req.flash('success', 'Movie added successfully.');
          res.redirect('/super-movie');
        });
      }
    });
  }
);

router.get('/admin-addMovie', isLoggedin, ensureadmin, function (req, res) {
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  res.render('admin/addMovie', {
    smessage: successMessage,
    emessage: errorMessage,
    currentUser: req.user,
     currentPage: 'movie',
  });
});

router.post(
  '/admin-addMovie',
  isLoggedin,
  ensureadmin,
  upload.single('image'),
  function (req, res) {
    const { movieTitle, summary, casts, status, genre, duration } = req.body;
    const imageFileName = req.file.filename;

    // Check if movie with the given title already exists
    const checkMovieQuery = `SELECT * FROM movies WHERE title = '${movieTitle}'`;
    connection.query(checkMovieQuery, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length > 0) {
        req.flash('error', 'Movie with the given title already exists!');
        res.redirect('/admin-addMovie');
      } else {
        const insertMovieQuery = `INSERT INTO movies (title, summary, casts, status, genre, duration, image) VALUES 
        ('${movieTitle}', '${summary}', '${casts}', '${status}', '${genre}', '${duration}', '${imageFileName}')`;
        connection.query(insertMovieQuery, (error, results) => {
          if (error) {
            req.flash('error', 'Error Adding the movie');
            res.redirect('/admin-addMovie');
          }

          req.flash('success', 'Movie added successfully.');
          res.redirect('/movie');
        });
      }

      // Movie with the given title does not exist, proceed with adding the movie
    });
  }
);

module.exports = router;
