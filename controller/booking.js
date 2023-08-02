const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};

function ensureUser(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'user') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}
router.post('/book-seats', isLoggedin, ensureUser, function (req, res) {
  const userId = req.user.id;
  const movieId = req.body.movieId;
  const hallId = req.body.hallId;
  const selectedSeats = req.body.selectedSeats.split(',');
  const screeningDate = new Date(req.body.date).toISOString().split('T')[0];
  const screeningTime = req.body.time;

  // Fetch additional data for the booking summary
  const movieQuery = `SELECT * FROM movies WHERE id = ${movieId}`;
  const hallQuery = `SELECT name, location FROM movie_halls WHERE id = ${hallId}`;

  connection.query(movieQuery, (movieError, movieResults) => {
    if (movieError) {
      console.error('Error fetching movie details:', movieError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.query(hallQuery, (hallError, hallResults) => {
      if (hallError) {
        console.error('Error fetching hall details:', hallError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const movieTitle = movieResults[0].title;
      const image = movieResults[0].image;
      const hallName = hallResults[0].name;
      const hallLocation = hallResults[0].location;

      // Calculate the amount for each selected seat
      const selectedSeatsWithAmount = selectedSeats.map((seatNumber) => {
        const seatAmount = req.body[`seatAmount${seatNumber}`];
        return { seatNumber, amount: seatAmount };
      });
      // Render the summary view with the booking details
      console.log(selectedSeats);

      //res.redirect('/seat-availability')

      res.render('user/summary', {
        movieId,
        hallId,
        image,
        movieTitle,
        hallName,
        hallLocation,
        screeningDate,
        screeningTime,
        selectedSeats: selectedSeatsWithAmount,
        currentUser: req.user,
      });
    });
  });
});
// Function to get current datetime formatted for MySQL datetime field
function getCurrentDateTimeForMySQL() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.post('/confirm-booking', isLoggedin, ensureUser, function (req, res) {
  const userId = req.user.id;
  const movieId = req.body.movieId;
  const hallId = req.body.hallId;
  const selectedSeats = req.body.selectedSeats;
  const screeningDate = req.body.date;
  const screeningTime = req.body.time;

  if (selectedSeats.length === 0) {
    return res.status(400).json({ error: 'Please select at least one seat.' });
  }

  const insertBookingQuery =
    'INSERT INTO bookings (user_id, movie_id, hall_id, seat_number, screening_date, screening_time, amount, booking_date_and_time) VALUES (?, ?, ?, ?, ?, ?, ?,?)';
  const bookingPromises = selectedSeats.map((seat) => {
    const seatNumber = seat.seatNumber;
    const seatAmount = seat.amount;
    return new Promise((resolve, reject) => {
      connection.query(
        insertBookingQuery,
        [
          userId,
          movieId,
          hallId,
          seatNumber,
          screeningDate,
          screeningTime,
          seatAmount,
          getCurrentDateTimeForMySQL(), // Call custom function to get current datetime formatted for MySQL
        ],
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
      req.flash('success', 'Successfully Booked.');
      res.redirect('/my-bookings');
    })
    .catch((error) => {
      console.error('Error booking seats: ', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});

module.exports = router;
