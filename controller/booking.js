const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};


// router.post('/book-seats', async function (req, res) {
//   const userId = req.user.id; // Assuming user ID is available in req.user.id
//   const movieId = req.body.movieId;
//   const hallId = req.body.hallId;
//   const selectedSeats = req.body.selectedSeats.split(',');
//   const screeningDate = new Date(req.body.date).toISOString().split('T')[0];
//   const screeningTime = req.body.time;

//   try {
//     // Perform necessary validation and error handling

//     // Convert seat numbers to the required format (e.g., N1, N2, V1, V2)
//     const formattedSeatNumbers = selectedSeats.map((seatNumber) => {
//       const seatType = seatNumber.startsWith('N') ? 'N' : 'V';
//       const seatIndex = seatNumber.substring(1);
//       return seatType + seatIndex;
//     });

//     // Insert the booking details into the database
//     const insertBookingQuery =
//       'INSERT INTO bookings (user_id, movie_id, hall_id, seat_number, screening_date, screening_time) VALUES (?, ?, ?, ?, ?, ?)';
//     const bookingPromises = formattedSeatNumbers.map((seatNumber) => {
//       console.log('Seats', seatNumber);
//       return connection.query(insertBookingQuery, [
//         userId,
//         movieId,
//         hallId,
//         seatNumber,
//         screeningDate,
//         screeningTime,
//       ]);
//     });

//     await Promise.all(bookingPromises);

//     // Booking successful, redirect to a success page or take appropriate action
//     res.redirect('/booking-success');
//   } catch (error) {
//     console.error('Error booking seats: ', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

router.post('/book-seats', isLoggedin, function (req, res) {
  const userId = req.user.id; // Assuming user ID is available in req.user.id
  const movieId = req.body.movieId;
  const hallId = req.body.hallId;
  const selectedSeats = req.body.selectedSeats.split(',');
  console.log('See', selectedSeats);
  const screeningDate = new Date(req.body.date).toISOString().split('T')[0];
  const screeningTime = req.body.time; // Add the screening time

  // Perform necessary validation and error handling
  if (selectedSeats.length === 0) {
    return res.status(400).json({ error: 'Please select at least one seat.' });
  }

  // Insert the booking details into the database
  const insertBookingQuery =
    'INSERT INTO Bookings (user_id, movie_id, hall_id, seat_number, screening_date, screening_time) VALUES (?, ?, ?, ?, ?, ?)';
  const bookingPromises = selectedSeats.map((seatNumber) => {
    return new Promise((resolve, reject) => {
      connection.query(
        insertBookingQuery,
        [userId, movieId, hallId, seatNumber, screeningDate, screeningTime],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  });

  Promise.all(bookingPromises)
    .then(() => {
      // Booking successful, redirect to a success page or take appropriate action
      res.redirect('/');
    })
    .catch((error) => {
      console.error('Error booking seats: ', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;
