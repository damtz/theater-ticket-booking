const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');

// Fetch movies and movie halls from the respective tables
router.get('/createMapping', function (req, res) {
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

      // Render the form and pass the movies and movie halls data
      res.render('admin/movieMapping', {
        movies: moviesResult,
        movieHalls: movieHallsResult,
      });
    });
  });
});

// Handle POST request to insert data into movie_hall_mapping table
// router.post('/movie-hall-mapping', (req, res) => {
//   const { movieId, movieHallId, screeningDate, screeningTime } = req.body;

//   // Create SQL query to insert data into movie_hall_mapping table
//   const insertQuery =
//     'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';
//   const values = [movieId, movieHallId, screeningDate, screeningTime];

//   // Execute the query
//   connection.query(insertQuery, values, (error, results) => {
//     if (error) {
//       console.error('Error:', error);
//       return res.status(500).send('Internal Server Error');
//     }

//     // Data inserted successfully
//     res.send('Data inserted into movie_hall_mapping table!');
//   });
// });

router.post('/movie-hall-mapping', (req, res) => {
  const { movieId, movieHallId, screeningDates, screeningTime } = req.body;

  // Create SQL query to insert data into movie_hall_mapping table
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

  // All data inserted successfully
  res.send('Data inserted into movie_hall_mapping table!');
});

module.exports = router;
