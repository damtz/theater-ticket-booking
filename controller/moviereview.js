const express = require('express');
const app = express();
const router = express.Router();
const session = require('express-session');
const { connection, passport } = require('../database');
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

function ensureUser(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'user') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    // If the user is not logged in or doesn't have the role "user," redirect to the desired route (e.g., home page)
    res.redirect('/login');
  }
}

router.get('/movie/:id', isLoggedin, ensureUser, function (req, res) {
  const movieId = req.params.id; // Assuming the movie ID is passed as a parameter in the URL

  const query = 'SELECT * FROM movies WHERE id = ?';

  connection.query(query, [movieId], (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }

    if (results.length === 0) {
      // Movie not found
      console.log('Movie not found');
      res.redirect('/');
      return;
    }

    const movie = Object.assign({}, results[0]);

    // Query to fetch reviews for the movie
    const reviewsQuery = 'SELECT * FROM movie_review WHERE movie_id = ?';

    connection.query(reviewsQuery, [movieId], (error, reviewResults) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return;
      }

      const reviews = reviewResults.map((row) => Object.assign({}, row));

      // Query to fetch users
      const usersQuery = 'SELECT * FROM users';

      connection.query(usersQuery, (error, userResults) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }

        const users = userResults.map((row) => Object.assign({}, row));

        res.render('user/movie', {
          movie: movie,
          reviews: reviews,
          users: users,
          currentUser: req.user,
        });
      });
    });
  });
});

router.post('/addReview', isLoggedin, ensureUser, function (req, res) {
  const { movieId, review } = req.body;

  const userId = req.user.id;

  if (!userId) {
    console.error('User ID is missing in the session');
    return;
  }

  const query =
    'INSERT INTO movie_review (movie_id, review, user_id) VALUES (?, ?, ?)';

  connection.query(query, [movieId, review, userId], (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }

    req.flash('success','Review given successfully!');
    res.redirect('/');
  });
});

module.exports = router;
