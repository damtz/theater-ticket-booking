const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const movieHallValidation = require('../validation/movieHallValidation');

// Add the express.json() middleware to parse the request body as JSON
router.use(express.json());

router.get('/addHall', function (req, res) {
  res.render('admin/addHall');
});

const error = [];

router.post('/add-hall', movieHallValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('admin/addHall', {
        errors: errMsg,
        inputData: inputData,
        error: error,
      });
    } else {
      const { name, location, capacity } = req.body;

      // Check for duplicate hall name
      const checkQuery = `SELECT COUNT(*) AS count FROM movie_halls WHERE name = '${name}'`;
      connection.query(checkQuery, (error, results) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }
        const hallCount = results[0].count;
        if (hallCount > 0) {
          console.log('Hall name already exists.');
          res.render('admin/addHall', {
            errorMessage: 'Hall name already exists.',
          });
        } else {
          const query = `INSERT INTO movie_halls (name, location, capacity) VALUES ('${name}', '${location}', '${capacity}')`;
          connection.query(query, (error, results) => {
            if (error) {
              console.error('Error executing the query: ', error);
              return;
            }
            console.log('Hall added successfully.');
            res.redirect('/');
          });
        }
      });
    }
  } catch (err) {
    console.log('Error: ' + err);
    res.render('admin/addHall', { errorMessage: 'Something went wrong' });
  }
});

// router.post('/hall-details', function (req, res) {
//   const hallName = req.body.hallName;

//   // Retrieve the hall details from the database based on the hall name
//   const query = `SELECT * FROM movie_halls WHERE name = '${hallName}'`;
//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error('Error executing the query: ', error);
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     // Check if a hall with the given name exists
//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Hall not found' });
//     }
//     const hallDetails = results[0];

//     const movieQuery = `SELECT * FROM movies WHERE hall_id = '${hallDetails.id}'`;

//     connection.query(movieQuery, (error, movieResults) => {
//       if (error) {
//         console.error('Error executing the query: ', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       // Add the movie results to the `hallDetails` object
//       hallDetails.movies = movieResults;

//       // Send the hall details with movie data as a JSON response
//       res.json(hallDetails);
//     });

//     // Send the hall details as a JSON response
//     // res.json(hallDetails);
//   });
// });

router.post('/hall-details', function (req, res) {
  const hallName = req.body.hallName;

  if (!hallName) {
    // Retrieve all movies if no hallName is specified
    const query = 'SELECT * FROM movies';

    connection.query(query, (error, movieResults) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Send the movie results as a JSON response
      res.json({ movies: movieResults });
    });
  } else {
    // Retrieve the hall details from the database based on the hall name
    const query = `SELECT * FROM movie_halls WHERE name = '${hallName}'`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if a hall with the given name exists
      if (results.length === 0) {
        return res.status(404).json({ error: 'Hall not found' });
      }
      const hallDetails = results[0];

      const movieQuery = `SELECT * FROM movies WHERE hall_id = '${hallDetails.id}'`;

      connection.query(movieQuery, (error, movieResults) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Add the movie results to the `hallDetails` object
        hallDetails.movies = movieResults;

        // Send the hall details with movie data as a JSON response
        res.json(hallDetails);
      });
    });
  }
});

// Define the route for movie details page
router.get('/movie-details', function (req, res) {
  const movieId = req.query.movieId;
  const selectedDate = req.query.date; // Retrieve the selected date from the query parameters

  // Retrieve the movie details from the database based on the movieId
  const movieQuery = `SELECT * FROM movies WHERE id = '${movieId}'`;
  connection.query(movieQuery, (movieError, movieResults) => {
    if (movieError) {
      console.error('Error executing the movie query: ', movieError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Check if a movie with the given ID exists
    if (movieResults.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const movieDetails = movieResults[0];

    // Retrieve the hall details based on the hall_id of the movie
    const hallQuery = `SELECT * FROM movie_halls WHERE id = '${movieDetails.hall_id}'`;
    connection.query(hallQuery, (hallError, hallResults) => {
      if (hallError) {
        console.error('Error executing the hall query: ', hallError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if a hall with the given ID exists
      if (hallResults.length === 0) {
        return res.status(404).json({ error: 'Hall not found' });
      }

      const hallDetails = hallResults[0];

      // Query the database to retrieve the booked seats for the movie, hall, and selected date
      const bookingsQuery =
        'SELECT seat_number FROM bookings WHERE movie_id = ? AND hall_id = ? AND date = ?';
      connection.query(
        bookingsQuery,
        [movieId, hallDetails.id, selectedDate],
        (bookingsError, bookingsResults) => {
          if (bookingsError) {
            console.error(
              'Error executing the bookings query: ',
              bookingsError
            );
            return res.status(500).json({ error: 'Internal server error' });
          }

          // Extract the seat numbers from the query results
          const bookedSeats = bookingsResults.map((row) => row.seat_number);

          // Render the movie details page and pass the movie, hall, selected date, and booked seats as data
          res.render('user/movieDetail', {
            movie: movieDetails,
            hall: hallDetails,
            selectedDate: selectedDate,
            bookedSeats: bookedSeats,
          });
        }
      );
    });
  });
});

module.exports = router;
