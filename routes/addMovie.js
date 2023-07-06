const express = require("express");
const app = express();
const router = express.Router();
const { connection, passport } = require("../database");

router.get("/addMovie", function (req, res) {
  const query = "SELECT * FROM languages";

  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error executing the query: ", error);
      return;
    }
    
    const languages = results.map((row) => Object.assign({}, row));
    
    const movieQuery = "SELECT * FROM movies"; // Query to fetch all added movies
    
    connection.query(movieQuery, (error, movieResults) => {
      if (error) {
        console.error("Error executing the query: ", error);
        return;
      }
      
      const movies = movieResults.map((row) => {
        const movie = Object.assign({}, row);
        
        const languageId = movie.language_id;
        
        // Find the selected language for the movie
        const selectedLanguage = languages.find((language) => language.id === languageId);

        if (selectedLanguage) {
          // Extract the name field from the selected language
          movie.languageName = selectedLanguage.name;
        }

        return movie;
      });
        
      res.render("admin/addMovie", {
        languages: languages,
        currentUser: req.user,
        movies: movies // Pass the movies array to the view
      });
    });
  });
});


router.post("/add-movie", function (req, res) {
  const {
    movieTitle,
    movieTrailer,
    movieSummary,
    casts,
    status,
    languageId,
  } = req.body;
  const movieImage = req.file.filename;

  const queryOne = `SELECT id FROM languages WHERE id = ${languageId}`;

  connection.query(queryOne, (error, results) => {
    if (error) {
      console.error("Error executing the query: ", error);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Language not found" });
    }

    const languageIdValue = results[0].id; // Get the ID of the selected language

    const query = `INSERT INTO movies (title, image, trailer, movie_summary, casts, status, likes, language_id)
                   VALUES ('${movieTitle}', '${movieImage}', '${movieTrailer}',
                           '${movieSummary}', '${casts}', '${status}', 0, ${languageIdValue})`;

    connection.query(query, (error, results) => {
      if (error) {
        console.error("Error executing the query: ", error);
        return res.status(500).json({ error: "Internal server error" });
      }

      console.log("Movie added successfully.");
      res.redirect("/addMovie");
    });
  });
});

module.exports = router;
