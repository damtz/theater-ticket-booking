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

router.get('/addMovie', isLoggedin, function (req, res) {
  const query = 'SELECT * FROM movie_halls';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    const Halls = results.map((row) => Object.assign({}, row));
    res.render('admin/addMovie', { Halls: Halls, currentUser: req.user });
  });
});

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

// Create the Multer middleware instance
const upload = multer({ storage: storage });

// ...

router.post(
  '/add-movie',
  isLoggedin,
  upload.single('image'),
  function (req, res) {
    const { movieTitle, time, summary, casts, status, genre } = req.body;
    const imageFileName = req.file.filename;

    const query = `INSERT INTO movies (title, time, summary, casts, status, genre, image) VALUES 
      ('${movieTitle}', '${time}', '${summary}', '${casts}', '${status}', '${genre}', '${imageFileName}')`;
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

// Insert the movie into the database

module.exports = router;
