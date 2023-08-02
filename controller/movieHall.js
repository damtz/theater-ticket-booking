const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const movieHallValidation = require('../validation/movieHallValidation');

router.use(express.json());

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/addHall', isLoggedin, function (req, res) {
  const smessage = req.flash('success');
  const emessage = req.flash('error');
  res.render('super/addHall', { smessage, emessage, currentUser: req.user, currentPage: 'movieHalls' });
});

const error = [];

// router.post(
//   '/add-hall',
//   isLoggedin,

//   function (req, res) {
//     const {
//       name,
//       location,
//       normal_capacity,
//       vip_capacity,
//       normal_rate,
//       vip_rate,
//     } = req.body;
//     const query = `INSERT INTO movie_halls (name, location, normal_capacity, vip_capacity, normal_rate, vip_rate) VALUES
//    ('${name}', '${location}', ${normal_capacity}, ${vip_capacity}, ${normal_rate}, ${vip_rate})`;
//     connection.query(query, (error, results) => {
//       if (error) {
//         req.flash('error', 'Hall added successfully.');
//         res.redirect('/movieHalls');
//       }

//       req.flash('success', 'Hall added successfully.');
//       res.redirect('/movieHalls');
//     });
//   }
// );

router.post('/add-hall', isLoggedin, function (req, res) {
  const {
    name,
    location,
    normal_capacity,
    vip_capacity,
    normal_rate,
    vip_rate,
  } = req.body;

  const checkQuery = `SELECT * FROM movie_halls WHERE name = ? AND location = ?`;
  connection.query(checkQuery, [name, location], (checkError, checkResults) => {
    if (checkError) {
      console.error('Error checking if hall exists:', checkError);
      req.flash('error', 'An error occurred while checking for existing hall.');
      res.redirect('/movieHalls');
    } else if (checkResults.length > 0) {
      req.flash(
        'error',
        'A hall with the same name and location already exists.'
      );
      res.redirect('/addHall');
    } else {
      const insertQuery = `INSERT INTO movie_halls (name, location, normal_capacity, vip_capacity, normal_rate, vip_rate) VALUES (?, ?, ?, ?, ?, ?)`;
      const values = [
        name,
        location,
        normal_capacity,
        vip_capacity,
        normal_rate,
        vip_rate,
      ];

      connection.query(insertQuery, values, (insertError, insertResults) => {
        if (insertError) {
          console.error('Error adding hall:', insertError);
          return req.flash('error', 'An error occurred while adding the hall.');
          res.redirect('/movieHalls');
        } else {
          req.flash('success', 'Hall added successfully.');
          res.redirect('/movieHalls');
        }
      });
    }
  });
});

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

router.get('/movie-details', function (req, res) {
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
        req.flash(
          'error',
          'This movie is not allocated in any of the Theatres!'
        );
        res.redirect('/');
      }

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
        currentUser: req.user,
        movie: movieDetails,
        halls: hallDetails,
        selectedDate: selectedDate,
        currentUser: req.user,
      });
    });
  });
});

router.get('/seat-availability', function (req, res) {
  const hallId = req.query.hallId;
  const movieId = req.query.movieId;
  const selectedDate = new Date(req.query.date).toISOString().split('T')[0];
  const selectedTime = req.query.time;

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
            currentUser: req.user,
            movie: movieResults[0],
            hall: hallResults[0],
            selectedDate: selectedDate,
            selectedTime: selectedTime,
            bookedSeats: bookedSeats,
            currentUser: req.user,
          });
        }
      );
    });
  });
});

module.exports = router;
