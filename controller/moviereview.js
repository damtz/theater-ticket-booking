const express = require("express");
const app = express();
const router = express.Router();
const session = require('express-session');
const { connection, passport } = require("../database");
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get("/movie/:id", isLoggedin, function (req, res) {
    const movieId = req.params.id; // Assuming the movie ID is passed as a parameter in the URL
    

    const query = "SELECT * FROM movies WHERE id = ?";
    
    connection.query(query, [movieId], (error, results) => {
      if (error) {
        console.error("Error executing the query: ", error);
        return;
      }
      
      if (results.length === 0) {
        // Movie not found
        console.log("Movie not found");
        res.redirect("/");
        return;
      }
      
      const movie = Object.assign({}, results[0]);
      
      // Query to fetch reviews for the movie
      const reviewsQuery = "SELECT * FROM movie_review WHERE movie_id = ?";
      
      connection.query(reviewsQuery, [movieId], (error, reviewResults) => {
        if (error) {
          console.error("Error executing the query: ", error);
          return;
        }
        
        const reviews = reviewResults.map((row) => Object.assign({}, row));
        
        // Query to fetch users
        const usersQuery = "SELECT * FROM users";
        
        connection.query(usersQuery, (error, userResults) => {
          if (error) {
            console.error("Error executing the query: ", error);
            return;
          }
          
          const users = userResults.map((row) => Object.assign({}, row));
          
          res.render("user/movie", {
            movie: movie,
            reviews: reviews,
            users: users,
            
          });
        });
      });
    });
  });
  

  router.post('/addReview', isLoggedin, function (req, res) {
    const { movieId, review } = req.body;
  
    const userId = req.session.user;
  
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
  
      console.log('Review added successfully!');
      res.redirect('/');
    });
  });
  
  
  module.exports = router;
  
  
  