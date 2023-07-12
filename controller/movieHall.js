const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const movieHallValidation = require('../validation/movieHallValidation');

// Add the express.json() middleware to parse the request body as JSON
router.use(express.json());

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/addHall',isLoggedin, function (req, res) {  
  const query = 'SELECT * FROM movie_halls';  
  connection.query(query, function(error, results) {
    if (error) {    
      console.error('Error executing the query: ', error);    
      return res.status(500).json({ error: 'Internal server error' });
    }    
    res.render('super/addHall', {error: null, results: results});
  });
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
      res.redirect('/');
    });
  }
);

// router.post('/add-hall', movieHallValidation, function (req, res) {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       var errMsg = errors.mapped();
//       var inputData = matchedData(req);
//       res.render('admin/addHall', {
//         errors: errMsg,
//         inputData: inputData,
//         error: error,
//       });
//     } else {
//       const {
//         name,
//         location,
//         normal_capacity,
//         vip_capacity,
//         normal_rate,
//         vip_rate,
//       } = req.body;

//       // Check for duplicate hall name
//       const checkQuery = `SELECT COUNT(*) AS count FROM movie_halls WHERE name = '${name}'`;
//       connection.query(checkQuery, (error, results) => {
//         if (error) {
//           console.error('Error executing the query: ', error);
//           return;
//         }
//         const hallCount = results[0].count;
//         if (hallCount > 0) {
//           console.log('Hall name already exists.');
//           res.render('admin/addHall', {
//             errorMessage: 'Hall name already exists.',
//           });
//         } else {
//           const query = `INSERT INTO movie_halls (name, location, normal_capacity, vip_capacity, normal_rate, vip_rate) VALUES
//           ('${name}', '${location}', '${normal_capacity}, ${vip_capacity}, ${normal_rate}, ${vip_rate})`;
//           connection.query(query, (error, results) => {
//             if (error) {
//               console.error('Error executing the query: ', error);
//               return;
//             }
//             console.log('Hall added successfully.');
//             res.redirect('/');
//           });
//         }
//       });
//     }
//   } catch (err) {
//     console.log('Error: ' + err);
//     res.render('admin/addHall', { errorMessage: 'Something went wrong' });
//   }
// });

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

//     connection.query(movieQuery, (error, mapResults) => {
//       if (error) {
//         console.error('Error executing the query: ', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       // Add the movie results to the `hallDetails` object
//       hallDetails.movies = mapResults;

//       // Send the hall details with movie data as a JSON response
//       res.json(hallDetails);
//     });

//     // Send the hall details as a JSON response
//     // res.json(hallDetails);
//   });
// });

router.post('/hall-details',isLoggedin, function (req, res) {
  const hallName = req.body.hallName;

  if (!hallName) {
    // Retrieve all movies if no hallName is specified
    const query = 'SELECT * FROM movies';

    connection.query(query, (error, mapResults) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Send the movie results as a JSON response
      res.json({ movies: mapResults });
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

      connection.query(movieQuery, (error, mapResults) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Add the movie results to the `hallDetails` object
        hallDetails.movies = mapResults;

        // Send the hall details with movie data as a JSON response
        res.json(hallDetails);
      });
    });
  }
});

// Define the route for movie details page
// router.get('/movie-details', function (req, res) {
//   const movieId = req.query.movieId;
//   const selectedDate = req.query.date; // Retrieve the selected date from the query parameters

//   // Retrieve the movie details from the database based on the movieId
//   const mapQuery = `SELECT * FROM movie_hall_mapping WHERE movie_id = '${movieId}'`;
//   connection.query(mapQuery, (movieError, mapResults) => {
//     if (movieError) {
//       console.error('Error executing the movie query: ', movieError);
//       return res.status(500).json({ error: 'Internal server error' });
//     }

//     // Check if a movie with the given ID exists
//     if (mapResults.length === 0) {
//       return res.status(404).json({ error: 'Movie not found' });
//     }

//     const movieDetails = mapResults[0];
//     const movieIdd = movieDetails.movie_id;

//     const movieQuery = `SELECT * FROM movies WHERE id= '${movieIdd}'`;
//     connection.query(movieQuery, (error, movieResults) => {
//       if (error) {
//         console.log(error);
//       }
//       // Retrieve the hall details based on the hall_id of the movie
//       const hallQuery = `SELECT * FROM movie_halls WHERE id = '${movieDetails.movie_hall_id}'`;
//       connection.query(hallQuery, (hallError, hallResults) => {
//         if (hallError) {
//           console.error('Error executing the hall query: ', hallError);
//           return res.status(500).json({ error: 'Internal server error' });
//         }

//         // Check if a hall with the given ID exists
//         if (hallResults.length === 0) {
//           return res.status(404).json({ error: 'Hall not found' });
//         }

//         const hallDetails = hallResults[0];

//         // Query the database to retrieve the booked seats for the movie, hall, and selected date
//         const bookingsQuery =
//           'SELECT seat_number FROM bookings WHERE movie_id = ? AND hall_id = ? AND date = ?';
//         connection.query(
//           bookingsQuery,
//           [movieId, hallDetails.id, selectedDate],
//           (bookingsError, bookingsResults) => {
//             if (bookingsError) {
//               console.error(
//                 'Error executing the bookings query: ',
//                 bookingsError
//               );
//               return res.status(500).json({ error: 'Internal server error' });
//             }

//             // Extract the seat numbers from the query results
//             const bookedSeats = bookingsResults.map((row) => row.seat_number);

//             // Render the movie details page and pass the movie, hall, selected date, and booked seats as data
//             res.render('user/movieDetail', {
//               movie: movieResults[0],
//               hall: hallDetails,
//               selectedDate: selectedDate,
//               bookedSeats: bookedSeats,
//             });
//           }
//         );
//       });
//     });
//   });
// });

router.get('/movie-details',isLoggedin, function (req, res) {
  const movieId = req.query.movieId;
  const selectedDate = req.query.date;

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

    // Retrieve the movie details
    const movieDetails = movieResults[0];

    // Query the database to retrieve the hall details and corresponding screening dates and times
    const hallsQuery = `SELECT movie_halls.*, movie_hall_mapping.screening_date, movie_hall_mapping.screening_time 
                        FROM movie_halls
                        JOIN movie_hall_mapping ON movie_halls.id = movie_hall_mapping.movie_hall_id
                        WHERE movie_hall_mapping.movie_id = '${movieId}'`;

    connection.query(hallsQuery, (hallsError, hallsResults) => {
      if (hallsError) {
        console.error('Error executing the halls query: ', hallsError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if any halls are found for the given movie ID
      if (hallsResults.length === 0) {
        return res
          .status(404)
          .json({ error: 'This Movie is not screening in Any theatre' });
      }

      // Group the results by hall ID
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

      // Render the movie details page and pass the movie, hall, selected date, and booked seats as data
      res.render('user/movieDetail', {
        movie: movieDetails,
        halls: hallDetails,
        selectedDate: selectedDate,
      });
    });
  });
});

router.get('/seat-availability',isLoggedin, function (req, res) {
  const hallId = req.query.hallId;
  const movieId = req.query.movieId;
  const selectedDate = new Date(req.query.date).toISOString().split('T')[0];
  const selectedTime = req.query.time;
  console.log('Date', selectedDate);
  console.log('Time', selectedTime);

  // Retrieve the movie details
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

    // Retrieve the hall details
    const hallQuery = `SELECT * FROM movie_halls WHERE id = '${hallId}'`;
    connection.query(hallQuery, (hallError, hallResults) => {
      if (hallError) {
        console.error('Error executing the hall query: ', hallError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if a hall with the given ID exists
      if (hallResults.length === 0) {
        return res.status(404).json({ error: 'Hall not found' });
      }

      // Query the database to retrieve the booked seats for the movie, hall, date, and time
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

          // Extract the seat numbers from the query results
          const bookedSeats = bookingsResults.map((row) => row.seat_number);

          // Render the seat availability page and pass the movie, hall, date, time, and booked seats as data
          res.render('user/seatAvailability', {
            movie: movieResults[0],
            hall: hallResults[0],
            selectedDate: selectedDate,
            selectedTime: selectedTime,
            bookedSeats: bookedSeats,
          });
        }
      );
    });
  });
});

module.exports = router;
