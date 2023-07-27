const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');
const PDFDocument = require('pdfkit');
const { strategies } = require('passport');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/adashboard', isLoggedin, function (req, res) {
  res.render('admin/dashboard', { currentUser: req.user });
});

router.get('/admin-booking', function (req, res) {
  const hallId = req.user.assigned_theater_id;

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

    res.render('admin/bookings', { bookings: formattedResults });
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

router.get('/download-booking/:bookingId', function (req, res) {
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
    doc.font('Helvetica').fontSize(12).text(`Ticket No: ${booking.booking_id}`);
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
    doc.text(`Time: ${booking.screening_time}`);
    doc.text(`Seat No: ${booking.seat_number}`);
    doc.text(`Amount: ${booking.amount}`);

    // Finalize the PDF document
    doc.end();
  });
});

// router.get('/report', function (req, res) {
//   const adminId = req.user.id;

//   // Fetch assigned_theater_id from users table
//   const assignedTheaterQuery = `SELECT assigned_theater_id FROM users WHERE id = ${adminId}`;
//   connection.query(
//     assignedTheaterQuery,
//     (assignedTheaterError, assignedTheaterResults) => {
//       if (assignedTheaterError) {
//         console.error(
//           'Error fetching assigned_theater_id:',
//           assignedTheaterError
//         );
//         return res.status(500).json({ error: 'Internal server error' });
//       }

//       const assignedTheaterId = assignedTheaterResults[0].assigned_theater_id;

//       // Fetch movie_hall_id from movie_halls_mapping table
//       const movieHallIdQuery = `SELECT movie_hall_id FROM movie_hall_mapping WHERE movie_hall_id = ${assignedTheaterId}`;
//       connection.query(
//         movieHallIdQuery,
//         (movieHallIdError, movieHallIdResults) => {
//           if (movieHallIdError) {
//             console.error('Error fetching movie_hall_id:', movieHallIdError);
//             return res.status(500).json({ error: 'Internal server error' });
//           }

//           const movieHallId = movieHallIdResults[0].movie_hall_id;

//           // Construct query to count tickets sold and left
//           const countQuery = `
//           SELECT
//             m.title AS movie_title,
//             DATE(b.screening_date) AS screening_date,
//             b.screening_time,
//             COUNT(*) AS tickets_sold,
//             ((SELECT normal_capacity FROM movie_halls WHERE id = ${movieHallId}) + (SELECT vip_capacity FROM movie_halls WHERE id = ${movieHallId})) - COUNT(*) AS tickets_left
//           FROM bookings b
//           JOIN movies m ON b.movie_id = m.id
//           WHERE
//             b.hall_id = ${movieHallId}
//             AND b.screening_date >= CURDATE()
//           GROUP BY b.hall_id, b.movie_id, DATE(b.screening_date), b.screening_time
//         `;

//           // Execute the query
//           connection.query(countQuery, (countError, countResults) => {
//             if (countError) {
//               console.error('Error counting tickets:', countError);
//               return res.status(500).json({ error: 'Internal server error' });
//             }

//             // Format the screening_date field in the desired format
//             const formattedResults = countResults.map((row) => {
//               const formattedDate = row.screening_date
//                 .toISOString()
//                 .split('T')[0];
//               return {
//                 ...row,
//                 screening_date: formattedDate,
//               };
//             });

//             // Group the results by movie_title
//             const groupedResults = [];
//             formattedResults.forEach((row) => {
//               const { movie_title } = row;
//               const group = groupedResults.find(
//                 (result) => result.movie_title === movie_title
//               );
//               if (group) {
//                 group.data.push(row);
//               } else {
//                 groupedResults.push({ movie_title, data: [row] });
//               }
//             });
//             console.log(groupedResults);
//             // Render the report view with the grouped results
//             res.render('admin/report', { ticketCounts: groupedResults });
//           });
//         }
//       );
//     }
//   );
// });
router.get('/report', function (req, res) {
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
