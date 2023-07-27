const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const movieHallValidation = require('../validation/movieHallValidation');

router.use(express.json());

function ensureUser(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'user') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    // If the user is not logged in or doesn't have the role "user," redirect to the desired route (e.g., home page)
    res.redirect('/login');
  }
}
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/addHall', function (req, res) {
  res.render('super/addHall');
});

const error = [];

router.post(
  '/add-hall',
  isLoggedin,

  function (req, res) {
    const {
      name,
      location,
      normal_capacity,
      vip_capacity,
      normal_rate,
      vip_rate,
    } = req.body;
    const query = `INSERT INTO movie_halls (name, location, normal_capacity, vip_capacity, normal_rate, vip_rate) VALUES 
   ('${name}', '${location}', ${normal_capacity}, ${vip_capacity}, ${normal_rate}, ${vip_rate})`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      console.log('Movie added successfully.');
      res.redirect('/sdashboard');
    });
  }
);

router.post('/hall-details', function (req, res) {
  const hallName = req.body.hallName;

  if (!hallName) {
    const query = 'SELECT * FROM movies';

    connection.query(query, (error, mapResults) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({ movies: mapResults });
    });
  } else {
    const query = `SELECT * FROM movie_halls WHERE name = '${hallName}'`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Hall not found' });
      }
      const hallDetails = results[0];

      const movieQuery = `SELECT * FROM movies WHERE hall_id = '${hallDetails.id}'`;

      connection.query(movieQuery, (error, mapResults) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return res.status(500).json({ error: 'Internal server error' });
        }

        hallDetails.movies = mapResults;

        res.json(hallDetails);
      });
    });
  }
});

router.get('/movie-details', ensureUser, function (req, res) {
  const movieId = req.query.movieId;
  const selectedDate = req.query.date;

  const movieQuery = `SELECT * FROM movies WHERE id = '${movieId}'`;
  connection.query(movieQuery, (movieError, movieResults) => {
    if (movieError) {
      console.error('Error executing the movie query: ', movieError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (movieResults.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Retrieve the movie details
    const movieDetails = movieResults[0];

    const hallsQuery = `SELECT movie_halls.*, movie_hall_mapping.screening_date, movie_hall_mapping.screening_time 
                        FROM movie_halls
                        JOIN movie_hall_mapping ON movie_halls.id = movie_hall_mapping.movie_hall_id
                        WHERE movie_hall_mapping.movie_id = '${movieId}'`;

    connection.query(hallsQuery, (hallsError, hallsResults) => {
      if (hallsError) {
        console.error('Error executing the halls query: ', hallsError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (hallsResults.length === 0) {
        return res
          .status(404)
          .json({ error: 'This Movie is not screening in Any theatre' });
      }
      // if (hallsResults.length === 0) {
      //   return res.redirect('/'); 
      // }
      

      const hallsMap = hallsResults.reduce((map, hall) => {
        const {
          id,
          name,
          location,
          normal_capacity,
          vip_capacity,
          normal_rate,
          vip_rate,
          screening_date,
          screening_time,
        } = hall;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name,
            location,
            normal_capacity,
            vip_capacity,
            normal_rate,
            vip_rate,
            screenings: [],
          });
        }
        map.get(id).screenings.push({ screening_date, screening_time });
        return map;
      }, new Map());

      // Convert the map values to an array of halls
      const hallDetails = Array.from(hallsMap.values());


      res.render('user/movieDetail', {
        movie: movieDetails,
        halls: hallDetails,
        selectedDate: selectedDate,
        currentUser: req.user
      });
    });
  });
});

router.get('/seat-availability',isLoggedin, ensureUser, function (req, res) {
  const hallId = req.query.hallId;
  const movieId = req.query.movieId;
  const selectedDate = new Date(req.query.date).toISOString().split('T')[0];
  const selectedTime = req.query.time;
  console.log('Date', selectedDate);
  console.log('Time', selectedTime);

  const movieQuery = `SELECT * FROM movies WHERE id = '${movieId}'`;
  connection.query(movieQuery, (movieError, movieResults) => {
    if (movieError) {
      console.error('Error executing the movie query: ', movieError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (movieResults.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const hallQuery = `SELECT * FROM movie_halls WHERE id = '${hallId}'`;
    connection.query(hallQuery, (hallError, hallResults) => {
      if (hallError) {
        console.error('Error executing the hall query: ', hallError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (hallResults.length === 0) {
        return res.status(404).json({ error: 'Hall not found' });
      }

      const bookingsQuery = `
        SELECT seat_number
        FROM bookings
        WHERE movie_id = ? AND hall_id = ? AND screening_date = ? AND screening_time = ?
      `;
      connection.query(
        bookingsQuery,
        [movieId, hallId, selectedDate, selectedTime],
        (bookingsError, bookingsResults) => {
          if (bookingsError) {
            console.error(
              'Error executing the bookings query: ',
              bookingsError
            );
            return res.status(500).json({ error: 'Internal server error' });
          }

          const bookedSeats = bookingsResults.map((row) => row.seat_number);

          res.render('user/seatAvailability', {
            movie: movieResults[0],
            hall: hallResults[0],
            selectedDate: selectedDate,
            selectedTime: selectedTime,
            bookedSeats: bookedSeats,
            currentUser: req.user

          });
        }
      );
    });
  });
});

module.exports = router;
