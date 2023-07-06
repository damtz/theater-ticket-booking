const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const movieHallValidation = require('../validation/movieHallValidation');

// Add the express.json() middleware to parse the request body as JSON
router.use(express.json());

router.get('/addHall', function (req, res) {
  // Retrieve the hall details from the database and pass it to the render method
  connection.query(`SELECT * FROM movie_halls`, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    const halls = results; // Assuming the result contains an array of halls

    res.render('admin/addHall', { halls,errorMessage:'' });
  });
});
const error = [];

router.post('/add-hall', movieHallValidation, function (req, res) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('admin/addHall', {
        halls,
        errors: errMsg,
        inputData: inputData,
        error: error,
        errorMessage:'error message',
      });
    } else {
      const { name, normalCapacity, vipCapacity, normalRate, vipRate } = req.body;

      // Check for duplicate hall name
      const checkQuery = `SELECT COUNT(*) AS count FROM movie_halls WHERE name = '${name}'`;
      connection.query(checkQuery, (error, results) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }
        const halls = results; // Assuming the result contains an array of halls
        const hallCount = results[0].count;
        if (hallCount > 0) {
          console.log('Hall name already exists.');
          res.render('admin/addHall', {halls,
            errorMessage: 'Hall name already exists.',
          });
          console.log('error executing the query ');

        } else {
          const query = `INSERT INTO movie_halls 
                        (name, normal_capacity, vip_capacity, normal_rate, vip_rate) 
                        VALUES ('${name}', ${normalCapacity}, ${vipCapacity}, ${normalRate}, ${vipRate})`;
          connection.query(query, (error, results) => {
            if (error) {
              console.error('Error executing the query: ', error);
              console.log('error executing the query ');
              return;
            }
            console.log('Hall added successfully.');
            res.redirect('/addHall');
          });
        }
      });
    }
  } catch (err) {
    console.log('Error: ' + err);
    res.render('admin/addHall', { errorMessage: 'Something went wrong' });
  }
});



router.post('/hall-details', function (req, res) {
  const hallName = req.body.hallName;

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

    // Send the hall details as a JSON response
    // res.json(hallDetails);
  });
});

// Define the route for movie details page
router.get('/movie-details', function (req, res) {
  const movieId = req.query.movieId;

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

      // Render the movie details page and pass the movie and hall details as data
      res.render('user/movieDetail', {
        movie: movieDetails,
        hall: hallDetails,
      });
    });
  });
});

module.exports = router;
