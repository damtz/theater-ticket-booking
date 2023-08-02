const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');
const multer = require('multer');
const fs = require('fs');


function ensuresuperadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'super-admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '_' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Adjust the file size limit as needed
}).single('image');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};

router.get('/sdashboard', isLoggedin, ensuresuperadmin, function (req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const successMessage = req.flash('success');
  const moviesQuery = `
    SELECT COUNT(DISTINCT movie_id) AS movies_screening_today
    FROM movie_hall_mapping
    WHERE screening_date = '${today}'
  `;

  const hallsQuery = `
    SELECT COUNT(DISTINCT movie_hall_id) AS halls_screening_today
    FROM movie_hall_mapping
    WHERE screening_date = '${today}'
  `;

  const bookingsQuery = `
    SELECT COUNT(*) AS total_bookings_today
    FROM bookings
    WHERE screening_date = '${today}'
  `;

  const ticketsQuery = `
    SELECT
      mh.movie_hall_id,
      mh.movie_id,
      DATE(mh.screening_date) AS screening_date,
      mh.screening_time,
      mh.hall_name,
      COUNT(b.booking_id) AS tickets_sold,
      (SELECT normal_capacity FROM movie_halls WHERE id = mh.movie_hall_id) +
      (SELECT vip_capacity FROM movie_halls WHERE id = mh.movie_hall_id) - COUNT(b.booking_id) AS tickets_left
    FROM (
      SELECT mhm.movie_hall_id, mhm.movie_id, mhm.screening_date, mhm.screening_time, mh.name AS hall_name
      FROM movie_hall_mapping mhm
      JOIN movie_halls mh ON mhm.movie_hall_id = mh.id
      WHERE DATE(mhm.screening_date) = '${today}'
    ) AS mh
    LEFT JOIN bookings b ON b.movie_id = mh.movie_id
      AND b.hall_id = mh.movie_hall_id
      AND DATE(b.screening_date) = '${today}'
      AND b.screening_time = mh.screening_time
    GROUP BY mh.movie_hall_id, mh.movie_id, screening_date, mh.screening_time, mh.hall_name
  `;

  const topMoviesQuery = `
    SELECT m.id AS movie_id, m.title AS movie_name, COUNT(b.booking_id) AS bookings_count
    FROM movies m
    LEFT JOIN bookings b ON b.movie_id = m.id
    GROUP BY m.id, m.title
    ORDER BY bookings_count DESC
    LIMIT 5
  `;

  connection.query(moviesQuery, (moviesError, moviesResults) => {
    if (moviesError) {
      console.error('Error fetching movies screening today:', moviesError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    connection.query(hallsQuery, (hallsError, hallsResults) => {
      if (hallsError) {
        console.error('Error fetching halls screening today:', hallsError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      connection.query(bookingsQuery, (bookingsError, bookingsResults) => {
        if (bookingsError) {
          console.error('Error fetching total bookings today:', bookingsError);
          return res.status(500).json({ error: 'Internal server error' });
        }

        connection.query(ticketsQuery, (ticketsError, ticketsResults) => {
          if (ticketsError) {
            console.error('Error fetching tickets data:', ticketsError);
            return res.status(500).json({ error: 'Internal server error' });
          }

          connection.query(
            topMoviesQuery,
            (topMoviesError, topMoviesResults) => {
              if (topMoviesError) {
                console.error('Error fetching top movies:', topMoviesError);
                return res.status(500).json({ error: 'Internal server error' });
              }

              const moviesScreeningToday =
                moviesResults[0].movies_screening_today;
              const hallsScreeningToday = hallsResults[0].halls_screening_today;
              const totalBookingsToday =
                bookingsResults[0].total_bookings_today;
              res.render('super/index', {
                currentUser: req.user,
                moviesScreeningToday,
                hallsScreeningToday,
                totalBookingsToday,
                ticketsData: ticketsResults,
                topMovies: topMoviesResults,
                smessage: successMessage,
                currentPage: 'sdashboard',
              });
            }
          );
        });
      });
    });
  });
});

router.get('/movieHalls', isLoggedin, ensuresuperadmin, function (req, res) {
  const hallQuerry = 'SELECT * FROM movie_halls';
  const successMessage = req.flash('success');
  const errorMessages = req.flash('error');
  connection.query(hallQuerry, (error, movieHalls) => {
    if (error) {
      console.log(error);
    }
    res.render('super/movieHalls', {
      currentUser: req.user,
      halls: movieHalls,
      smessage: successMessage,
      emessage: errorMessages,
      currentPage: 'movieHalls',
    });
  });
});

router.get(
  '/hallUpdate/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const hallid = req.params.id;

    const hallQuerry = 'SELECT * FROM movie_halls WHERE id = ?';
    connection.query(hallQuerry, [hallid], (error, result) => {
      if (error) {
        console.log(error);
      } else {
        const hall = result[0];
        res.render('super/hallUpdate', { hall: hall, currentUser: req.user, currentPage: 'movieHalls' });
      }
    });
  }
);

router.get('/user', isLoggedin, ensuresuperadmin, function (req, res) {
  const userQuery = 'SELECT * FROM users WHERE role = ?';
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');

  connection.query(userQuery, ['admin'], (error, Users) => {
    if (error) {
      console.log(error);
      res.status(500).send('Internal server error'); // Handle the error and respond with an error page or message
      return;
    }

    // Get the IDs of theaters assigned to admins
    const theaterIds = Users.map((user) => user.assigned_theater_id);

    // Check if theaterIds array is empty
    if (theaterIds.length === 0) {
      // No theaterIds found, directly render the page with the user data
      res.render('super/users', {
        currentUser: req.user,
        Users,
        smessage: successMessage,
        emessage: errorMessage,
        currentPage: 'user',
      });
      return;
    }

    // Query to get theater details using the IDs
    const theaterQuery = 'SELECT * FROM movie_halls WHERE id IN (?)';

    connection.query(theaterQuery, [theaterIds], (error, Theaters) => {
      if (error) {
        console.log(error);
        res.status(500).send('Internal server error'); // Handle the error and respond with an error page or message
        return;
      }

      // Create a mapping of theater IDs to their details
      const theaterMap = {};
      Theaters.forEach((theater) => {
        theaterMap[theater.id] = theater;
      });

      // Add theater details to each user object
      Users.forEach((user) => {
        const theaterId = user.assigned_theater_id;
        user.theater = theaterMap[theaterId];
      });

      res.render('super/users', {
        currentUser: req.user,
        Users,
        smessage: successMessage,
        emessage: errorMessage,
        currentPage: 'user'
      });
    });
  });
});

router.post(
  '/hallUpdate/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const hallId = req.params.id;

    const {
      name,
      location,
      normal_capacity,
      vip_capacity,
      normal_rate,
      vip_rate,
      status,
    } = req.body;

    const updateQuerry = `UPDATE movie_halls SET name='${name}', location='${location}', normal_capacity='${normal_capacity}', 
      vip_capacity='${vip_capacity}', normal_rate='${normal_rate}', vip_rate='${vip_rate}', status='${status}' WHERE id= ?`;
    connection.query(updateQuerry, [hallId], (error, results) => {
      if (error) {
        console.log(err);
      } else {
        req.flash('success', 'Hall updated successfully.');
        res.redirect('/movieHalls');
      }
    });
  }
);

router.get(
  '/hallDelete/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const hallId = req.params.id;

    const deleleQuerry = 'DELETE FROM movie_halls WHERE id= ?';

    connection.query(deleleQuerry, [hallId], (error, result) => {
      if (error) {
        console.log(error);
      } else {
        req.flash('success', 'Hall deleted successfully!');
        res.redirect('/movieHalls');
      }
    });
  }
);

router.get('/mapping', isLoggedin, ensuresuperadmin, function (req, res) {
  const query = `
    SELECT mhm.*, movies.title AS movie_name, movie_halls.name AS hall_name
    FROM movie_hall_mapping AS mhm
    JOIN movies ON mhm.movie_id = movies.id
    JOIN movie_halls ON mhm.movie_hall_id = movie_halls.id
  `;
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');

  connection.query(query, (error, mappingData) => {
    if (error) {
      console.error('Error fetching movie hall mapping data:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    const formattedResults = mappingData.map((mapping) => {
      const formattedDate = new Date(mapping.screening_date).toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
      );
      const formattedTime = formatTime(mapping.screening_time);

      return {
        ...mapping,
        screening_date: formattedDate,
        screening_time: formattedTime,
      };
    });

    // Render the hallMapping view with the mappingData
    res.render('super/hallMapping', {
      currentUser: req.user,
      mappings: formattedResults,
      smessage: successMessage,
      emessage: errorMessage,
      currentPage: 'mapping'
    });
  });
});

function formatTime(time) {
  const parts = time.split(':');
  const hour = parseInt(parts[0]);
  const minute = parseInt(parts[1]);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour > 12 ? hour - 12 : hour;
  const formattedTime =
    formattedHour + ':' + (minute < 10 ? '0' + minute : minute) + ' ' + period;
  return formattedTime;
}

router.get('/super-movie', ensuresuperadmin, function (req, res) {
  const hallQuerry = 'SELECT * FROM movies';
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  connection.query(hallQuerry, (error, movies) => {
    if (error) {
      console.log(error);
    }
    res.render('super/movie', {
      currentUser: req.user,
      movies,
      smessage: successMessage,
      emessage: errorMessage,
      currentPage: 'super-movie',
    });
  });
});

router.get(
  '/super-edit-movie/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const movieId = req.params.id;

    const movieQuery = `SELECT * from movies where id = ${movieId}`;

    connection.query(movieQuery, (error, Movie) => {
      if (error) {
        console.log(error);
        return;
      }
      const movie = Movie[0];
      res.render('super/editMovies', { movie, currentUser: req.user, currentPage: 'super-movie', });
    });
  }
);

router.post(
  '/super-edit-movie/:id',
  isLoggedin,
  ensuresuperadmin,
  upload,
  function (req, res) {
    const movieId = req.params.id;
    const { movieTitle, summary, casts, status, genre, duration } = req.body;
    console.log('MOS', movieTitle);

    // Check if a new image was uploaded
    const imageFileName = req.file ? req.file.filename : null;

    // Update the movie details
    const updateQuery = `
    UPDATE movies
    SET title='${movieTitle}', summary='${summary}', casts='${casts}', 
    status='${status}', genre='${genre}', duration='${duration}'
    ${imageFileName ? `, image='${imageFileName}'` : ''}
    WHERE id=${movieId}
  `;

    connection.query(updateQuery, (error, results) => {
      if (error) {
        req.flash('error', 'Movie update failed!');
        res.redirect('/super-movie');
      }

      req.flash('success', 'Movie updated successfully.');
      res.redirect('/super-movie');
    });
  }
);

router.get(
  '/super-addMovie',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');
    res.render('super/addMovie', {
      currentUser: req.user,
      smessage: successMessage,
      emessage: errorMessage,
      currentPage: 'super-movie',
    });
  }
);

router.get(
  '/movieDelete/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const movieId = req.params.id;

    // Retrieve the image filename for the movie before deleting it from the database
    const getMovieImageQuery = 'SELECT image FROM movies WHERE id = ?';
    connection.query(getMovieImageQuery, [movieId], (error, result) => {
      if (error) {
        console.log(error);
      } else {
        const imageFileName = result[0].image;

        // Delete the movie from the database
        const deleteQuery = 'DELETE FROM movies WHERE id = ?';
        connection.query(deleteQuery, [movieId], (error, result) => {
          if (error) {
            req.flash('error', 'Cannot delete this movie');
            res.redirect('/super-movie');         
          } else {
            // Delete the corresponding image file from the local storage
            fs.unlink(`public/images/${imageFileName}`, (error) => {
              if (error) {
                console.log('Error deleting image file: ', error);
              } else {
                req.flash('success', 'Movie deleted successfully!');
                res.redirect('/super-movie');
              }
            });
          }
        });
      }
    });
  }
);

router.get(
  '/mappingUpdate/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const mappId = req.params.id;

    const mapQuery = `
    SELECT mhm.*, movies.title AS movie_name, movie_halls.name AS hall_name
    FROM movie_hall_mapping AS mhm
    JOIN movies ON mhm.movie_id = movies.id
    JOIN movie_halls ON mhm.movie_hall_id = movie_halls.id
    WHERE mhm.id = ${mappId}
  `;

    connection.query(mapQuery, (error, Mapping) => {
      if (error) {
        console.error('Error fetching movie hall mapping data:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (Mapping.length === 0) {
        // If no mapping found with the provided id
        return res.status(404).json({ error: 'Mapping not found' });
      }

      const mapping = Mapping[0];

      // Format the screening_date and screening_time
      const formattedDate = new Date(mapping.screening_date).toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
      );
      const formattedTime = formatTime(mapping.screening_time);

      // Add the formatted date and time to the mapping object
      mapping.screening_date = formattedDate;
      mapping.screening_time = formattedTime;

      // Now fetch the data for the 'movies' table
      const moviesQuery = 'SELECT * FROM movies';
      connection.query(moviesQuery, (moviesError, moviesResults) => {
        if (moviesError) {
          console.error('Error fetching movies data:', moviesError);
          return res.status(500).json({ error: 'Internal server error' });
        }

        const movies = moviesResults; // Assuming moviesResults is an array of movie objects

        // Now fetch the data for the 'movie_halls' table
        const movieHallsQuery = 'SELECT * FROM movie_halls';
        connection.query(movieHallsQuery, (hallError, hallResults) => {
          if (hallError) {
            console.error('Error fetching movie halls data:', hallError);
            return res.status(500).json({ error: 'Internal server error' });
          }

          const movieHalls = hallResults; // Assuming hallResults is an array of movie hall objects

          res.render('super/hallMappingEdit', {
            mapping,
            movies,
            movieHalls,
            currentUser: req.user,
            currentPage: 'mapping',
          });
        });
      });
    });
  }
);

router.post(
  '/mappingUpdate/:id',
  isLoggedin,
  ensuresuperadmin,
  function (req, res) {
    const mappId = req.params.id;
    const { movieId, movieHallId, screeningDates, screeningTime } = req.body;

    // Create a function to check if the updated data already exists in the table
    const checkDataExists = (date) => {
      const query = `SELECT COUNT(*) as count FROM movie_hall_mapping WHERE movie_id = ? AND movie_hall_id = ? AND screening_date = ? AND screening_time = ? AND id != ?`;
      const values = [
        movieId,
        req.user.assigned_theater_id,
        date,
        screeningTime,
        mappId,
      ];

      return new Promise((resolve, reject) => {
        connection.query(query, values, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count > 0);
          }
        });
      });
    };

    // Ensure screeningDates is an array
    const datesArray = Array.isArray(screeningDates)
      ? screeningDates
      : [screeningDates];

    // Iterate over each screening date and execute the query
    const promises = datesArray.map((screeningDate) => {
      return checkDataExists(screeningDate).then((dataExists) => {
        if (dataExists) {
          // Data already exists, return an error
          return Promise.reject(
            'Mapping for selected date already exists. Please select a different date.'
          );
        } else {
          // Data does not exist, proceed with the update
          const updateQuery = `UPDATE movie_hall_mapping SET movie_id = ?, movie_hall_id = ?, screening_date = ?, screening_time = ? WHERE id = ?`;
          const values = [
            movieId,
            movieHallId,
            screeningDate,
            screeningTime,
            mappId,
          ];
          return new Promise((resolve, reject) => {
            connection.query(updateQuery, values, (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        }
      });
    });

    // Execute all promises
    Promise.all(promises)
      .then(() => {
        req.flash('success', 'Movie mapping updated successfully.');
        res.redirect('/mapping');
      })
      .catch((error) => {
        req.flash('error', error);
        res.redirect('/mapping');
      });
  }
);

router.get('/mappingDelete/:id', ensuresuperadmin, function (req, res) {
  const mapId = req.params.id;

  const deleleQuerry = 'DELETE FROM movie_hall_mapping WHERE id= ?';

  connection.query(deleleQuerry, [mapId], (error, result) => {
    if (error) {
      console.log(error);
    } else {
      req.flash('success', 'Mapping deleted successfully!');
      res.redirect('/mapping');
    }
  });
});

module.exports = router;
