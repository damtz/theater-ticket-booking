const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/createMapping', isLoggedin, function (req, res) {
  const moviesQuery = 'SELECT id, title FROM movies';
  const movieHallsQuery = 'SELECT id, name FROM movie_halls';

  connection.query(moviesQuery, (moviesError, moviesResult) => {
    if (moviesError) {
      console.error('Error:', moviesError);
      return res.status(500).send('Internal Server Error');
    }

    connection.query(movieHallsQuery, (movieHallsError, movieHallsResult) => {
      if (movieHallsError) {
        console.error('Error:', movieHallsError);
        return res.status(500).send('Internal Server Error');
      }

      res.render('super/movieMapping', {
        movies: moviesResult,
        movieHalls: movieHallsResult,
      });
    });
  });
});

router.post('/movie-hall-mapping', isLoggedin, (req, res) => {
  const { movieId, movieHallId, screeningDates, screeningTime } = req.body;

  const insertQuery =
    'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';

  // Iterate over each screening date and execute the query
  screeningDates.forEach((screeningDate) => {
    const values = [movieId, movieHallId, screeningDate, screeningTime];
    connection.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
      }
    });
  });

  res.send('Data inserted into movie_hall_mapping table!');
});

router.get('/movie-Mapping', isLoggedin, function (req, res) {
  const moviesQuery = 'SELECT id, title FROM movies';
  const movieHallsQuery = 'SELECT id, name FROM movie_halls';

  // Execute the queries
  connection.query(moviesQuery, (moviesError, moviesResult) => {
    if (moviesError) {
      console.error('Error:', moviesError);
      return res.status(500).send('Internal Server Error');
    }

    connection.query(movieHallsQuery, (movieHallsError, movieHallsResult) => {
      if (movieHallsError) {
        console.error('Error:', movieHallsError);
        return res.status(500).send('Internal Server Error');
      }

      res.render('admin/createMapping', {
        movies: moviesResult,
        movieHalls: movieHallsResult,
      });
    });
  });
});

router.post('/movie-mapping', isLoggedin, (req, res) => {
  const { movieId, screeningDates, screeningTime } = req.body;
  const movieHallId = req.user.assigned_theater_id;

  const insertQuery =
    'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';

  screeningDates.forEach((screeningDate) => {
    const values = [movieId, movieHallId, screeningDate, screeningTime];
    connection.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
      }
    });
  });

  res.send('Data inserted into movie_hall_mapping table!');
});

module.exports = router;
