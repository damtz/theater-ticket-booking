const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');

// router.get('/booking', (req, res) => {
//   const { seat, hall, movie } = req.query;

//   // Fetch the movie hall name based on its ID
//   const hallQuery = 'SELECT name FROM movie_halls WHERE id = ?';
//   connection.query(hallQuery, [hall], (hallError, hallResult) => {
//     if (hallError) {
//       console.error('Error:', hallError);
//       return res.status(500).send('Internal Server Error');
//     }

//     // Fetch the movie title based on its ID
//     const movieQuery = 'SELECT title, time FROM movies WHERE id = ?';
//     connection.query(movieQuery, [movie], (movieError, movieResult) => {
//       if (movieError) {
//         console.error('Error:', movieError);
//         return res.status(500).send('Internal Server Error');
//       }

//       // Extract the hall name and movie title from the query results
//       const hallName =
//         hallResult && hallResult.length > 0 ? hallResult[0].name : '';
//       const movieTitle =
//         movieResult && movieResult.length > 0 ? movieResult[0].title : '';
//       const movieTime =
//         movieResult && movieResult.length > 0 ? movieResult[0].time : '';

//       // Render the booking view and pass the seat, hall, and movie data
//       res.render('user/booking', {
//         seat,
//         hall: hallName,
//         movie: movieTitle,
//         time: movieTime,
//       });
//     });
//   });
// });

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/booking', isLoggedin, (req, res) => {
  const { seats, hall, movie, date } = req.query;
  const selectedSeats = seats.split(','); // Split the seats string into an array

  // Fetch the movie hall name based on its ID
  const hallQuerry = 'SELECT * FROM movie_halls WHERE id= ?';
  connection.query(hallQuerry, [hall], (hallError, hallResult) => {
    if (hallError) {
      console.error('Error:', hallError);
      return res.status(500).send('Internal Server Error');
    }
    const hallName =
      hallResult && hallResult.length > 0 ? hallResult[0].name : '';

    // Fetch the movie title based on its ID
    const movieQuery = 'SELECT title, time FROM movies WHERE id = ?';
    connection.query(movieQuery, [movie], (movieError, movieResult) => {
      if (movieError) {
        console.error('Error:', movieError);
        return res.status(500).send('Internal Server Error');
      }

      // Extract the hall name and movie title from the query results
      const movieTitle =
        movieResult && movieResult.length > 0 ? movieResult[0].title : '';
      const movieTime =
        movieResult && movieResult.length > 0 ? movieResult[0].time : '';

      // Calculate the total price of selected seats
      let totalPrice = 0;

      selectedSeats.forEach((seat) => {
        if (parseInt(seat) <= hallResult[0].normal_capacity) {
          totalPrice += hallResult[0].normal_rate;
        } else {
          totalPrice += hallResult[0].vip_rate;
        }
      });

      // Render the booking view and pass the selected seats, hall, and movie data
      res.render('user/booking', {
        selectedSeats: selectedSeats,
        seats: selectedSeats,
        hallResult,
        hall_id: hall,
        movie,
        movieTitle,
        time: movieTime,
        date,
        totalPrice,
      });
    });
  });
});

router.get('/success', isLoggedin, function (req, res) {
  res.render('user/success');
});

// Retrieve seat availability based on movie ID and selected date
app.post('/seat-availability', (req, res) => {
  const { movieId, date } = req.body;
  console.log('THIS', movieId);

  // Query the database to retrieve booked seats for the movie and date
  const query =
    'SELECT seat_number FROM bookings WHERE movie_id = ? AND date = ?';
  connection.query(query, [movieId, date], (error, results) => {
    if (error) {
      console.error('Error:', error);
      return res.status(500).send('Internal Server Error');
    }

    // Extract the seat numbers from the query results
    const bookedSeats = results.map((row) => row.seat_number);

    res.json(bookedSeats);
  });
});

// Start your server and listen to incoming requests

router.post('/booking', isLoggedin, async (req, res) => {
  const { seats, hall, movie, date, time } = req.body;
  const userId = req.user.id;

  const selectedSeats = seats;
  try {
    // Check for duplicate booking
    const duplicateQuery =
      'SELECT * FROM bookings WHERE seat_number IN (?) AND hall_id = ? AND movie_id = ? AND date = ?';
    connection.query(
      duplicateQuery,
      [selectedSeats, hall, movie, date],
      (duplicateError, duplicateRows) => {
        if (duplicateError) {
          console.error('Error:', duplicateError);
          return res.status(500).send('Internal Server Error');
        }

        // If duplicate rows are found, send an error message
        if (duplicateRows.length > 0) {
          return res
            .status(400)
            .send(
              'Duplicate booking detected. Please choose a different seat or time.'
            );
        }

        // Insert the booking data into the database
        const insertQuery =
          'INSERT INTO bookings (seat_number, hall_id, movie_id, date, time, user_id) VALUES ?';
        const insertValues = selectedSeats.map((seat) => [
          seat,
          hall,
          movie,
          date,
          time,
          userId,
        ]);
        connection.query(insertQuery, [insertValues], (insertError) => {
          if (insertError) {
            console.error('Error:', insertError);
            return res.status(500).send('Internal Server Error');
          }

          // Redirect to a success page or display a success message
          res.redirect('/success');
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

//Admin booking
router.get('/abookings', function (req, res) {
  const bookingQuery = 'SELECT * from bookings';
  connection.query(bookingQuery, (Error, bookingResult) => {
    if (Error) {
      console.log('Error', Error);
    }
    res.render('admin/booking', { bookingResult });
  });
});

module.exports = router;
