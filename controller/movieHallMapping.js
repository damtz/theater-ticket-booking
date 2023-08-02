const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};
function ensureadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}
function ensuresuperadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'super-admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}

router.get('/createMapping', isLoggedin,ensuresuperadmin, function (req, res) {
  const moviesQuery = 'SELECT id, title, status FROM movies';
  const movieHallsQuery = 'SELECT id, name FROM movie_halls';
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  connection.query(moviesQuery, (moviesError, moviesResult) => {
    if (moviesError) {
      console.error('Error:', moviesError);
      return res.status(500).send('Internal Server Error');
    }

    connection.query(movieHallsQuery, (movieHallsError, movieHallsResult) => {
      if (movieHallsError) {
        console.error('Error:', movieHallsError);
        return res.status(500).send('Internal Server Error');
      }

      res.render('super/hallMappingCreate', {
        currentUser: req.user,
        movies: moviesResult,
        movieHalls: movieHallsResult,
        smessage,
        emessage,
        currentPage: 'mapping',
      });
    });
  });
});

router.post('/movie-hall-mapping', isLoggedin, (req, res) => {
  const { movieId, movieHallId, screeningDates, screeningTime } = req.body;
  const insertQuery =
    'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';

  // Create a function to check if the data already exists in the table
  const checkDataExists = (date) => {
    const query =
      'SELECT COUNT(*) as count FROM movie_hall_mapping WHERE movie_id = ? AND movie_hall_id = ? AND screening_date = ? AND screening_time = ?';
    const values = [movieId, movieHallId, date, screeningTime];

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
        // Data does not exist, insert the new entry
        const values = [movieId, movieHallId, screeningDate, screeningTime];
        return new Promise((resolve, reject) => {
          connection.query(insertQuery, values, (error, results) => {
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
      req.flash('success', 'Mapping created Successfully!');
      res.redirect('/mapping');
    })
    .catch((error) => {
      req.flash('error', error);
      res.redirect('/createMapping');
    });
});

//For Super Admin //
router.get('/adminMovieMapping', isLoggedin,ensureadmin, function (req, res) {
  const hallId = req.user.assigned_theater_id;
  const query = `
    SELECT mhm.*, movies.title AS movie_name, movie_halls.name AS hall_name
    FROM movie_hall_mapping AS mhm
    JOIN movies ON mhm.movie_id = movies.id
    JOIN movie_halls ON mhm.movie_hall_id = movie_halls.id
    WHERE mhm.movie_hall_id = ${hallId}
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
    res.render('admin/hallMapping', {
      currentUser: req.user,
      mappings: formattedResults,
      smessage: successMessage,
      emessage: errorMessage,
      currentPage: 'adminMovieMapping',
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

router.get('/adminCreateMapping', isLoggedin,ensureadmin, function (req, res) {
  const moviesQuery = 'SELECT id, title, status FROM movies';
  const movieHallsQuery = 'SELECT id, name FROM movie_halls';
  const smessage = req.flash('success');
  const emessage = req.flash('error');
  // Execute the queries
  connection.query(moviesQuery, (moviesError, moviesResult) => {
    if (moviesError) {
      console.error('Error:', moviesError);
      return res.status(500).send('Internal Server Error');
    }

    connection.query(movieHallsQuery, (movieHallsError, movieHallsResult) => {
      if (movieHallsError) {
        console.error('Error:', movieHallsError);
        return res.status(500).send('Internal Server Error');
      }

      res.render('admin/hallMappingCreate', {
        currentUser: req.user,
        movies: moviesResult,
        movieHalls: movieHallsResult,
        smessage,
        emessage,
        currentPage: 'adminMovieMapping',
      });
    });
  });
});

router.post('/movie-mapping', isLoggedin, (req, res) => {
  const { movieId, screeningDates, screeningTime } = req.body;
  const movieHallId = req.user.assigned_theater_id;

  const insertQuery =
    'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';

  // Convert screeningDates to an array if it's not already one
  const datesArray = Array.isArray(screeningDates)
    ? screeningDates
    : [screeningDates];

  datesArray.forEach((screeningDate) => {
    const values = [movieId, movieHallId, screeningDate, screeningTime];
    connection.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).send('Internal Server Error');
      }
    });
  });

  res.send('Data inserted into movie_hall_mapping table!');
});

router.post('/adminCreateMapping', isLoggedin,ensureadmin, (req, res) => {
  const { movieId, screeningDates, screeningTime } = req.body;
  const movieHallId = req.user.assigned_theater_id;
  const insertQuery =
    'INSERT INTO movie_hall_mapping (movie_id, movie_hall_id, screening_date, screening_time) VALUES (?, ?, ?, ?)';

  // Create a function to check if the data already exists in the table
  const checkDataExists = (date) => {
    const query =
      'SELECT COUNT(*) as count FROM movie_hall_mapping WHERE movie_id = ? AND movie_hall_id = ? AND screening_date = ? AND screening_time = ?';
    const values = [movieId, movieHallId, date, screeningTime];

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
        // Data does not exist, insert the new entry
        const values = [movieId, movieHallId, screeningDate, screeningTime];
        return new Promise((resolve, reject) => {
          connection.query(insertQuery, values, (error, results) => {
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
      req.flash('success', 'Mapping created Successfully!');
      res.redirect('/adminMovieMapping');
    })
    .catch((error) => {
      req.flash('error', error);
      res.redirect('/adminMovieMapping');
    });
});

module.exports = router;
