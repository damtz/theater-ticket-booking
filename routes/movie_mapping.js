const express = require("express");
const app = express();
const router = express.Router();
const { connection, passport } = require("../database");

// // GET route for adding a movie hall mapping
// router.get("/addMovieHallMapping", function (req, res) {
//     const movieQuery = "SELECT id, title FROM movies";
//     const hallQuery = "SELECT id, name FROM movie_halls";
//     const mappingQuery = "SELECT * FROM movie_hall_mapping";
  
//     connection.query(movieQuery, (error, movieResults) => {
//       if (error) {
//         console.error("Error executing the query: ", error);
//         return res.status(500).json({ error: "Internal server error" });
//       }
  
//       connection.query(hallQuery, (error, hallResults) => {
//         if (error) {
//           console.error("Error executing the query: ", error);
//           return res.status(500).json({ error: "Internal server error" });
//         }
  
//         connection.query(mappingQuery, (error, mappingResults) => {
//           if (error) {
//             console.error("Error executing the query: ", error);
//             return res.status(500).json({ error: "Internal server error" });
//           }
  
//           const movies = movieResults.map((row) => ({
//             id: row.id,
//             title: row.title,
//           }));
  
//           const halls = hallResults.map((row) => ({
//             id: row.id,
//             name: row.name,
//           }));
  
//           const mappings = mappingResults.map((row) => ({
//             movie: movies.find((movie) => movie.id === row.movieId),
//             hall: halls.find((hall) => hall.id === row.hallId),
//             date: new Date(row.screeningDate),
//             time: new Date(row.screeningTime)
//           }));
  
//           res.render("admin/addMovieHallMapping", { movies, halls, mappings });
//         });
//       });
//     });
//   });
// GET route for adding a movie hall mapping
router.get("/addMovieHallMapping", function (req, res) {
    const mappingQuery = `
      SELECT 
        mapping.*, 
        movies.title AS movieTitle, 
        movie_halls.name AS hallName 
      FROM 
        movie_hall_mapping AS mapping 
        JOIN movies ON mapping.movie_id = movies.id 
        JOIN movie_halls ON mapping.movie_hall_id = movie_halls.id`;
  
    connection.query(mappingQuery, (error, mappingResults) => {
      if (error) {
        console.error("Error executing the query: ", error);
        return res.status(500).json({ error: "Internal server error" });
      }
  
      const mappings = mappingResults.map((row) => ({
        movieId: row.movie_id,
        movieTitle: row.movieTitle,
        hallId: row.movie_hall_id,
        hallName: row.hallName,
        screeningDateTime: new Date(row.screening_date_time),
      }));
      const movies = []; // Populate this array with movie data from your database
      const halls = []; 
      res.render("admin/addMovieHallMapping", { mappings,movies, halls });
    });
  });
  
  

  // POST route for adding a movie hall mapping
  router.post("/add-movie-hall-mapping", function (req, res) {
    const { movieId, hallId, screeningDateTime } = req.body;
  
    const query = `INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date_time)
                   VALUES (${movieId}, ${hallId}, '${screeningDateTime}')`;
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error executing the query: ", error);
        return res.status(500).json({ error: "Internal server error" });
      }
  
      console.log("Movie hall mapping added successfully.");
      res.redirect("/addMovieHallMapping");
    });
  });
  
  module.exports = router;
  