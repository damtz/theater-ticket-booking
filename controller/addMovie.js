const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const fileUpload = require('express-fileupload');
app.use(fileUpload());
const multer = require('multer');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

const errorMessage = [];

// router.get('/addMovie', isLoggedin, function (req, res) {
//   const query = 'SELECT * FROM movie_halls';

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error('Error executing the query: ', error);
//       return;
//     }
//     const Halls = results.map((row) => Object.assign({}, row));
//     res.render('admin/addMovie', {
//       Halls: Halls,
//       currentUser: req.user,
//       errorMessage: errorMessage,
//     });
//   });
// });
router.get("/addMovie", function (req, res) {
  const Query = 'SELECT * FROM movie_halls';

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
        const selectedLanguage = languages.find(
          (language) => language.id === languageId
        );

        if (selectedLanguage) {
          // Extract the name field from the selected language
          movie.languageName = selectedLanguage.name;
        }

        return movie;
      });
      const Halls = results.map((row) => Object.assign({}, row));
      res.render("admin/addMovie", {
        languages: languages,
        currentUser: req.user,
        Halls: Halls,
        movies: movies,
        errorMessage: errorMessage, // Pass the movies array to the view
      });
    });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '_' + file.originalname);
  },
});

const upload = multer({ storage: storage });
router.post(
  "/add-movie",
  isLoggedin,
  upload.single("image"),
  function (req, res) {
    const {
      movieTitle,
      movieTrailer,
      summary,
      casts,
      status,
      genre,
      duration,
      languageId,
    } = req.body;
    const imageFileName = req.file.filename;

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

      const query = `INSERT INTO movies (title, trailer, summary, casts, status, genre, duration, image, language_id)
               SELECT '${movieTitle}', '${movieTrailer}',
                      '${summary}', '${casts}', '${status}', '${genre}', '${duration}', '${imageFileName}', ${languageIdValue}
               FROM dual
               WHERE NOT EXISTS (
                 SELECT 1
                 FROM movies
                 WHERE UPPER(title) = UPPER('${movieTitle}')
               )`;

      connection.query(query, (error, results) => {
        if (error) {
          console.error("Error executing the query: ", error);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (results.affectedRows === 0) {
          errorMessage.push('Movie with the given title already exists');
          res.redirect('/addMovie');        }

        console.log("Movie added successfully.");
        res.redirect("/addMovie");
      });
    });
  }
);

// router.post(
//   '/add-movie',
//   isLoggedin,
//   upload.single('image'),
//   function (req, res) {
//     const { movieTitle, summary, casts, status, genre } = req.body;
//     const imageFileName = req.file.filename;

//     // Check if movie with the given title already exists
//     const checkMovieQuery = `SELECT * FROM movies WHERE title = '${movieTitle}'`;
//     connection.query(checkMovieQuery, (error, results) => {
//       if (error) {
//         console.error('Error executing the query: ', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       if (results.length > 0) {
//         errorMessage.push('Movie with the given title already exists');
//         res.redirect('/addMovie');
//       } else {
//         const insertMovieQuery = `INSERT INTO movies (title, summary, casts, status, genre, image) VALUES 
//         ('${movieTitle}', '${summary}', '${casts}', '${status}', '${genre}', '${imageFileName}')`;
//         connection.query(insertMovieQuery, (error, results) => {
//           if (error) {
//             console.error('Error executing the query: ', error);
//             return res.status(500).json({ error: 'Internal server error' });
//           }

//           console.log('Movie added successfully.');
//           res.redirect('/');
//         });
//       }

//       // Movie with the given title does not exist, proceed with adding the movie
//     });
//   }
// );

module.exports = router;
