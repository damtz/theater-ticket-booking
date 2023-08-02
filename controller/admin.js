const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');
const PDFDocument = require('pdfkit');
const { strategies } = require('passport');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

app.use(fileUpload());
const multer = require('multer');

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

// Parse incoming request bodies in a middleware before your handlers, available under req.body
app.use(bodyParser.urlencoded({ extended: true }));

function ensureadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}
const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};

router.get('/adashboard', isLoggedin, ensureadmin, function (req, res) {
  const today = new Date().toISOString().slice(0, 10);
  const hallId = req.user.assigned_theater_id;
  const smessage = req.flash('success');
  const capacityQuery = `
    SELECT
      SUM(normal_capacity + vip_capacity) AS total_capacity,
      SUM(normal_capacity + vip_capacity) -
      COALESCE(SUM(b.tickets_booked), 0) AS tickets_available,
      COALESCE(SUM(b.tickets_booked), 0) AS tickets_booked_today,
      COALESCE(SUM(b.vip_tickets_booked), 0) AS vip_tickets_booked,
      COALESCE(SUM(b.normal_tickets_booked), 0) AS normal_tickets_booked,
      COALESCE(SUM(b.vip_tickets_booked * mh.vip_rate), 0) AS vip_revenue,
      COALESCE(SUM(b.normal_tickets_booked * mh.normal_rate), 0) AS normal_revenue
    FROM movie_halls mh
    LEFT JOIN (
      SELECT
        hall_id,
        COUNT(*) AS tickets_booked,
        SUM(CASE WHEN seat_number LIKE 'V%' AND screening_date = '${today}' THEN 1 ELSE 0 END) AS vip_tickets_booked,
        SUM(CASE WHEN seat_number LIKE 'N%' AND screening_date = '${today}' THEN 1 ELSE 0 END) AS normal_tickets_booked
      FROM bookings
      WHERE hall_id = ${hallId} AND screening_date = '${today}' -- Add the condition for today's date using single-line comment
      GROUP BY hall_id
    ) AS b ON mh.id = b.hall_id
    WHERE mh.id = ${hallId}
  `;

  connection.query(capacityQuery, (error, results) => {
    if (error) {
      console.error('Error fetching ticket capacity:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Extract the required data from the results
    const totalCapacity = results[0].total_capacity;
    const ticketsAvailable = results[0].tickets_available;
    const ticketsBookedToday = results[0].tickets_booked_today;
    const vipTicketsBooked = results[0].vip_tickets_booked;
    const normalTicketsBooked = results[0].normal_tickets_booked;
    const vipRevenue = results[0].vip_revenue;
    const normalRevenue = results[0].normal_revenue;

    const screeningsQuery = `
    SELECT movies.title AS movie_name, movie_halls.name AS hall_name, movie_hall_mapping.screening_date, movie_hall_mapping.screening_time
    FROM movie_hall_mapping
    JOIN movies ON movie_hall_mapping.movie_id = movies.id
    JOIN movie_halls ON movie_hall_mapping.movie_hall_id = movie_halls.id
    WHERE movie_hall_mapping.movie_hall_id = ${hallId} AND movie_hall_mapping.screening_date = '${today}'
  `;

    connection.query(screeningsQuery, (screeningsError, screeningsResults) => {
      if (screeningsError) {
        console.error('Error fetching screenings data:', screeningsError);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Extract the screenings data for today
      const todayScreening = screeningsResults[0];

      const bookingsQuery = `
    SELECT movies.title AS movie_name, COUNT(*) AS tickets_sold
    FROM bookings
    JOIN movies ON bookings.movie_id = movies.id
    WHERE hall_id = ${hallId}
    GROUP BY movies.title
  `;

      connection.query(bookingsQuery, (bookingsError, bookingsResults) => {
        if (bookingsError) {
          console.error('Error fetching tickets data:', bookingsError);
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Extract the movies and tickets sold data
        const moviesData = bookingsResults.map((result) => ({
          movie_name: result.movie_name,
          tickets_sold: result.tickets_sold,
        }));

        // Now, query the bookings table again to get top 5 movies based on ticketsSold
        const topMoviesQuery = `
        SELECT movies.title AS movie_name, COUNT(*) AS tickets_sold
        FROM bookings
        JOIN movies ON bookings.movie_id = movies.id
        WHERE hall_id = ${hallId}
        GROUP BY movies.title
        ORDER BY tickets_sold DESC
        LIMIT 5
      `;

        connection.query(topMoviesQuery, (topMoviesError, topMoviesResults) => {
          if (topMoviesError) {
            console.error('Error fetching top movies:', topMoviesError);
            return res.status(500).json({ error: 'Internal server error' });
          }

          // Extract the top 5 movies and tickets sold data
          const topMoviesData = topMoviesResults.map((result) => ({
            movie_name: result.movie_name,
            tickets_sold: result.tickets_sold,
          }));

          // Rest of your code to render the page and generate the chart
          res.render('admin/index', {
            currentUser: req.user,
            totalCapacity,
            ticketsAvailable,
            ticketsBookedToday,
            vipTicketsBooked,
            normalTicketsBooked,
            vipRevenue,
            normalRevenue,
            moviesData,
            topMoviesData, // Pass the top 5 movies data to the view
            todayScreening,
            smessage,
            currentPage: 'aDashboard',
          });
        });
      });
    });
  });
});

router.get('/admin-booking', isLoggedin, ensureadmin, function (req, res) {
  const hallId = req.user.assigned_theater_id;
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  const query = `
    SELECT b.*, u.username, u.email, mh.name AS hall_name, mh.location AS hall_location, m.title AS movie_title
    FROM bookings AS b
    JOIN users AS u ON b.user_id = u.id
    JOIN movie_halls AS mh ON b.hall_id = mh.id
    JOIN movies AS m ON b.movie_id = m.id
    WHERE b.hall_id = ${hallId}
    `;

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Format the date and time in the desired format
    const formattedResults = results.map((booking) => {
      const formattedDate = new Date(booking.screening_date).toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }
      );
      const formattedTime = formatTime(booking.screening_time);

      return {
        ...booking,
        screening_date: formattedDate,
        screening_time: formattedTime,
      };
    });

    res.render('admin/bookings', {
      currentUser: req.user,
      bookings: formattedResults,
      smessage,
      emessage,
      currentPage: 'aBooking',
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

router.get(
  '/download-booking/:bookingId',
  isLoggedin,
  ensureadmin,
  function (req, res) {
    const bookingId = req.params.bookingId;

    // Fetch the booking details from the database based on the booking ID
    const query = `
    SELECT b.*, u.username, u.email, mh.name AS hall_name, mh.location AS hall_location, m.title AS movie_title
    FROM bookings AS b
    JOIN users AS u ON b.user_id = u.id
    JOIN movie_halls AS mh ON b.hall_id = mh.id
    JOIN movies AS m ON b.movie_id = m.id
    WHERE b.booking_id = ${bookingId}
  `;

    connection.query(query, (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).send('Booking not found');
      }

      const booking = results[0];

      // Create a new PDF document
      const doc = new PDFDocument();

      // Set response headers to make the browser treat the response as a PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=booking_details.pdf'
      );

      // Pipe the PDF document to the response
      doc.pipe(res);

      // Add content to the PDF document
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('Booking Details', { align: 'center' });
      doc.moveDown();
      doc
        .font('Helvetica')
        .fontSize(12)
        .text(`Ticket No: ${booking.booking_id}`);
      doc.text(`Movie Name: ${booking.movie_title}`);
      doc.text(`Booked By: ${booking.username}`);
      doc.text(`Hall Name: ${booking.hall_name}`);
      doc.text(`Location: ${booking.hall_location}`);
      doc.text(
        `Booking Date: ${new Date(booking.screening_date).toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }
        )}`
      );
      const formattedTime = formatTime(booking.screening_time);
      doc.text(`Time: ${formattedTime}`);
      doc.text(`Seat No: ${booking.seat_number}`);
      doc.text(`Amount: ${booking.amount}`);

      // Finalize the PDF document
      doc.end();
    });
  }
);

const ExcelJS = require('exceljs');
const { render } = require('ejs');

router.get('/download-bookings', isLoggedin, ensureadmin, function (req, res) {
  // Fetch all booking details from the database
  const query = `
    SELECT b.*, u.username, u.email, mh.name AS hall_name, mh.location AS hall_location, m.title AS movie_title
    FROM bookings AS b
    JOIN users AS u ON b.user_id = u.id
    JOIN movie_halls AS mh ON b.hall_id = mh.id
    JOIN movies AS m ON b.movie_id = m.id
  `;

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).send('No bookings found');
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    // Define table headers
    const headers = [
      'Ticket No',
      'Movie Name',
      'Booked By',
      'Hall Name',
      'Location',
      'Booking Date',
      'Time',
      'Seat No',
      'Amount',
    ];

    // Add headers to the worksheet
    worksheet.addRow(headers);

    // Add booking details to the worksheet
    results.forEach((booking) => {
      const ticketNo = booking.booking_id ? booking.booking_id.toString() : '';
      const movieName = booking.movie_title || '';
      const bookedBy = booking.username || '';
      const hallName = booking.hall_name || '';
      const location = booking.hall_location || '';
      const bookingDate = booking.screening_date
        ? new Date(booking.screening_date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '';
      const time = formatTime(booking.screening_time) || '';
      const seatNo = booking.seat_number || '';
      const amount = booking.amount ? booking.amount.toString() : '';

      const row = [
        ticketNo,
        movieName,
        bookedBy,
        hallName,
        location,
        bookingDate,
        time,
        seatNo,
        amount,
      ];

      worksheet.addRow(row);
    });

    // Set the response headers to make the browser treat the response as an Excel file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.xlsx');

    // Write the workbook to the response
    workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
      });
  });
});

router.get('/report-old', isLoggedin, ensureadmin, function (req, res) {
  const adminId = req.user.id;

  // Fetch assigned_theater_id from users table
  const assignedTheaterQuery = `SELECT assigned_theater_id FROM users WHERE id = ${adminId}`;
  connection.query(
    assignedTheaterQuery,
    (assignedTheaterError, assignedTheaterResults) => {
      if (assignedTheaterError) {
        console.error(
          'Error fetching assigned_theater_id:',
          assignedTheaterError
        );
        return res.status(500).json({ error: 'Internal server error' });
      }

      const assignedTheaterId = assignedTheaterResults[0].assigned_theater_id;

      // Fetch movie_hall_mapping details based on assigned_theater_id
      const mappingQuery = `
        SELECT
          mh.name AS hall_name,
          mh.location,
          m.title AS movie_title,
          mhm.screening_date,
          mhm.screening_time,
          COUNT(b.booking_id) AS bookings_count,
          (SELECT normal_capacity FROM movie_halls WHERE id = mhm.movie_hall_id) +
          (SELECT vip_capacity FROM movie_halls WHERE id = mhm.movie_hall_id) - COUNT(b.booking_id) AS tickets_left
        FROM movie_hall_mapping mhm
        JOIN movie_halls mh ON mhm.movie_hall_id = mh.id
        JOIN movies m ON mhm.movie_id = m.id
        LEFT JOIN bookings b ON b.movie_id = m.id
          AND b.hall_id = mhm.movie_hall_id
          AND b.screening_date = mhm.screening_date
          AND b.screening_time = mhm.screening_time
        WHERE mhm.movie_hall_id = ${assignedTheaterId}
        GROUP BY mhm.movie_hall_id, mhm.movie_id, mhm.screening_date, mhm.screening_time
      `;

      // Execute the query
      connection.query(mappingQuery, (mappingError, mappingResults) => {
        if (mappingError) {
          console.error(
            'Error fetching movie_hall_mapping details:',
            mappingError
          );
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Format the screening date and time
        const formattedResults = mappingResults.map((booking) => {
          const formattedDate = new Date(
            booking.screening_date
          ).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = formatTime(booking.screening_time);

          return {
            ...booking,
            screening_date: formattedDate,
            screening_time: formattedTime,
          };
        });

        // Render the report view with the formatted movie_hall_mapping details
        res.render('admin/report', { movieHallMapping: formattedResults });
      });
    }
  );
});

router.get('/report', isLoggedin, ensureadmin, function (req, res) {
  const adminId = req.user.id;
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  // Fetch assigned_theater_id from users table
  const assignedTheaterQuery = `SELECT assigned_theater_id FROM users WHERE id = ${adminId}`;
  connection.query(
    assignedTheaterQuery,
    (assignedTheaterError, assignedTheaterResults) => {
      if (assignedTheaterError) {
        console.error(
          'Error fetching assigned_theater_id:',
          assignedTheaterError
        );
        return res.status(500).json({ error: 'Internal server error' });
      }

      const assignedTheaterId = assignedTheaterResults[0].assigned_theater_id;

      // Fetch movie_hall_mapping details based on assigned_theater_id
      const mappingQuery = `
        SELECT
          mh.name AS hall_name,
          mh.location,
          m.title AS movie_title,
          mhm.screening_date,
          mhm.screening_time,
          COUNT(b.booking_id) AS bookings_count,
          (SELECT normal_capacity FROM movie_halls WHERE id = mhm.movie_hall_id) +
          (SELECT vip_capacity FROM movie_halls WHERE id = mhm.movie_hall_id) - COUNT(b.booking_id) AS tickets_left,
          SUM(b.amount) AS revenue
        FROM movie_hall_mapping mhm
        JOIN movie_halls mh ON mhm.movie_hall_id = mh.id
        JOIN movies m ON mhm.movie_id = m.id
        LEFT JOIN bookings b ON b.movie_id = m.id
          AND b.hall_id = mhm.movie_hall_id
          AND b.screening_date = mhm.screening_date
          AND b.screening_time = mhm.screening_time
        WHERE mhm.movie_hall_id = ${assignedTheaterId}
        GROUP BY mhm.movie_hall_id, mhm.movie_id, mhm.screening_date, mhm.screening_time
      `;

      // Execute the query to fetch movie_hall_mapping details
      connection.query(mappingQuery, (mappingError, mappingResults) => {
        if (mappingError) {
          console.error(
            'Error fetching movie_hall_mapping details:',
            mappingError
          );
          return res.status(500).json({ error: 'Internal server error' });
        }

        // Format the screening date and time
        const formattedResults = mappingResults.map((booking) => {
          const formattedDate = new Date(
            booking.screening_date
          ).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const formattedTime = formatTime(booking.screening_time);

          return {
            ...booking,
            screening_date: formattedDate,
            screening_time: formattedTime,
          };
        });

        // Count the number of tickets sold for each movie
        const movieTicketCounts = formattedResults.reduce((counts, booking) => {
          const { movie_title, bookings_count } = booking;
          counts[movie_title] = (counts[movie_title] || 0) + bookings_count;
          return counts;
        }, {});

        // Calculate the total revenue for each movie
        const movieRevenue = formattedResults.reduce((revenues, booking) => {
          const { movie_title, revenue } = booking;
          revenues[movie_title] = (revenues[movie_title] || 0) + revenue;
          return revenues;
        }, {});

        // Sort the movies based on ticket counts in descending order
        const sortedMovies = Object.keys(movieTicketCounts).sort(
          (a, b) => movieTicketCounts[b] - movieTicketCounts[a]
        );

        // Get the top two most watched movies
        const topTwoMovies = sortedMovies.slice(0, 2);

        // Combine the movie titles, ticket counts, and revenues into a single array
        const movieData = Object.entries(movieTicketCounts).map(
          ([movie_title, count]) => ({
            movie_title,
            count,
            revenue: movieRevenue[movie_title] || 0,
          })
        );

        // Sort the movie data based on ticket counts in descending order
        const sortedMovieData = movieData.sort((a, b) => b.count - a.count);

        // Render the report view with the formatted movie_hall_mapping details, top two movies, and movie data
        res.render('admin/report', {
          currentUser: req.user,
          movieHallMapping: formattedResults,
          topTwoMovies,
          movieData: sortedMovieData,
          smessage,
          emessage,
          currentPage: 'report',
        });
      });
    }
  );
});

router.get('/movie', isLoggedin, ensureadmin, function (req, res) {
  const moviehallId = req.user.assigned_theater_id;
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  const movieQuery = `
    SELECT m.*
    FROM movie_hall_mapping mhm
    JOIN movies m ON mhm.movie_id = m.id
    WHERE mhm.movie_hall_id = ${moviehallId}
  `;

  connection.query(movieQuery, (error, movies) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Store unique movies based on their IDs
    const uniqueMovies = new Set();
    const uniqueMovieList = [];

    movies.forEach((movie) => {
      if (!uniqueMovies.has(movie.id)) {
        uniqueMovies.add(movie.id);
        uniqueMovieList.push(movie);
      }
    });

    res.render('admin/movie', {
      movies: uniqueMovieList,
      smessage,
      emessage,
      currentUser: req.user,
      currentPage: 'movie',
    });
  });
});

router.get(
  '/admin-edit-movie/:id',
  isLoggedin,
  ensureadmin,
  function (req, res) {
    const movieId = req.params.id;

    const movieQuery = `SELECT * from movies where id = ${movieId}`;

    connection.query(movieQuery, (error, Movie) => {
      if (error) {
        console.log(error);
        return;
      }
      const movie = Movie[0];
      res.render('admin/editMovies', { movie, currentPage: 'movie', currentUser: req.user });
    });
  }
);

router.post(
  '/admin-edit-movie/:id',
  isLoggedin,
  ensureadmin,
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
        res.redirect('/movie');
      }

      req.flash('success', 'Movie updated successfully.');
      res.redirect('/movie');
    });
  }
);

router.get(
  '/movieDeleteAdmin/:id',
  isLoggedin,
  ensureadmin,
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
            req.flash('error', 'Could not delete this movie');
            res.redirect('/movie');
          } else {
            // Delete the corresponding image file from the local storage
            fs.unlink(`public/images/${imageFileName}`, (error) => {
              if (error) {
                console.log('Error deleting image file: ', error);
              } else {
                req.flash('success', 'Movie deleted successfully!');
                res.redirect('/movie');
              }
            });
          }
        });
      }
    });
  }
);

router.get(
  '/mappingUpdateAdmin/:id',
  isLoggedin,
  ensureadmin,
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

          res.render('admin/hallMappingEdit', {
            mapping,
            movies,
            movieHalls,
            currentUser: req.user,
            currentPage: 'adminMovieMapping',
          });
        });
      });
    });
  }
);

router.post(
  '/mappingUpdateAdmin/:id',
  isLoggedin,
  ensureadmin,
  function (req, res) {
    const mappId = req.params.id;
    const { movieId, screeningDates, screeningTime } = req.body;

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
          const updateQuery = `UPDATE movie_hall_mapping SET movie_id = ?, screening_date = ?, screening_time = ? WHERE id = ?`;
          const values = [movieId, screeningDate, screeningTime, mappId];
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
        res.redirect('/adminMovieMapping');
      })
      .catch((error) => {
        req.flash('error', error);
        res.redirect('/adminMovieMapping');
      });
  }
);

router.get(
  '/mappingDeleteAdmin/:id',
  isLoggedin,
  ensureadmin,
  function (req, res) {
    const mapId = req.params.id;

    const deleleQuerry = 'DELETE FROM movie_hall_mapping WHERE id= ?';

    connection.query(deleleQuerry, [mapId], (error, result) => {
      if (error) {
        console.log(error);
      } else {
        req.flash('success', 'Mapping deleted successfully!');
        res.redirect('/adminMovieMapping');
      }
    });
  }
);

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

module.exports = router;
