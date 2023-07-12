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

// router.get('/addMovie', isLoggedin, function (req, res) {
//   const query = 'SELECT * FROM movie_halls';

//   connection.query(query, (error, results) => {
//     if (error) {
//       console.error('Error executing the query: ', error);
//       return;
//     }
//     const Halls = results.map((row) => Object.assign({}, row));
//     res.render('admin/addMovie', { Halls: Halls, currentUser: req.user });
//   });
// });

// router.post('/add-movie', isLoggedin, function (req, res) {
//   const { movieTitle, movieHall, time } = req.body;
//   const imageFile = req.files.image;
//   const imageFileName = `${Date.now()}_${imageFile.name}`;

//   const queryOne = `SELECT id FROM movie_halls WHERE name = '${movieHall}'`;

//   imageFile.mv(`public/images/${imageFileName}`, (error) => {
//     if (error) {
//       console.error('Error:', error);
//       return res.status(500).send('Internal Server Error');
//     }

//     connection.query(queryOne, (error, results) => {
//       if (error) {
//         console.error('Error executing the query: ', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       if (results.length === 0) {
//         return res.status(404).json({ error: 'Hall not found' });
//       }
//       const hallId = results[0].id;

//       const query = `INSERT INTO movies (title, movie_hall, hall_id, time, image) VALUES ('${movieTitle}', '${movieHall}', ${hallId}, '${time}', '${imageFileName}')`;
//       connection.query(query, (error, results) => {
//         if (error) {
//           console.error('Error executing the query: ', error);
//           return res.status(500).json({ error: 'Internal server error' });
//         }

//         console.log('Movie added successfully.');
//         res.redirect('/');
//       });
//     });

//     // Insert the movie into the database
//   });
// });

// router.post(
//   '/add-movie',
//   isLoggedin,
//   upload.single('image'),
//   function (req, res) {
//     const { movieTitle, movieHall, time } = req.body;
//     const imageFileName = req.file.filename;

//     // Rest of your code...
//     const queryOne = `SELECT id FROM movie_halls WHERE name = '${movieHall}'`;

//     imageFile.mv(`public/images/${imageFileName}`, (error) => {
//       if (error) {
//         console.error('Error:', error);
//         return res.status(500).send('Internal Server Error');
//       }

//       connection.query(queryOne, (error, results) => {
//         if (error) {
//           console.error('Error executing the query: ', error);
//           return res.status(500).json({ error: 'Internal server error' });
//         }

//         if (results.length === 0) {
//           return res.status(404).json({ error: 'Hall not found' });
//         }
//         const hallId = results[0].id;

//         const query = `INSERT INTO movies (title, movie_hall, hall_id, time, image) VALUES ('${movieTitle}', '${movieHall}', ${hallId}, '${time}', '${imageFileName}')`;
//         connection.query(query, (error, results) => {
//           if (error) {
//             console.error('Error executing the query: ', error);
//             return res.status(500).json({ error: 'Internal server error' });
//           }

//           console.log('Movie added successfully.');
//           res.redirect('/');
//         });
//       });

//       // Insert the movie into the database
//     });
//   }
// );

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
        const selectedLanguage = languages.find(
          (language) => language.id === languageId
        );

        if (selectedLanguage) {
          // Extract the name field from the selected language
          movie.languageName = selectedLanguage.name;
        }

        return movie;
      });

      res.render("admin/addMovie", {
        languages: languages,
        currentUser: req.user,
        movies: movies, // Pass the movies array to the view
      });
    });
  });
});

// Set up Multer storage configuration
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

// ...

// router.post(
//   '/add-movie',
//   isLoggedin,
//   upload.single('image'),
//   function (req, res) {
//     const { movieTitle, summary, casts, status, genre, duration } = req.body;
//     const imageFileName = req.file.filename;

//     const query = `INSERT INTO movies (title, summary, casts, status, genre, duration image) VALUES 
//       ('${movieTitle}', '${summary}', '${casts}', '${status}', '${genre}', '${duration}', '${imageFileName}')`;
//     connection.query(query, (error, results) => {
//       if (error) {
//         console.error('Error executing the query: ', error);
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       console.log('Movie added successfully.');
//       res.redirect('/');
//     });
//   }
// );
router.post("/add-movie", isLoggedin, upload.single("image"), function (req, res) {
  const { movieTitle, movieTrailer, movieSummary, genre, casts, status, duration, languageId } =
    req.body;
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
                   VALUES ('${movieTitle}', '${movieTrailer}',
                           '${movieSummary}','${casts}', '${status}','${genre}', '${duration}', '${imageFileName}', ${languageIdValue})`;

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
// Insert the movie into the database

module.exports = router;
