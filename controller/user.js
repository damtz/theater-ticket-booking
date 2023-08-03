const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { check, validationResult, matchedData } = require('express-validator');
const registerValidation = require('../validation/registerValidation');
const bcrypt = require('bcrypt');
const session = require('express-session');
const PDFDocument = require('pdfkit');
const transporter = require('../config/email');

router.use(passport.initialize());
router.use(passport.session());

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

function ensureuser(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'user') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    res.redirect('/login');
  }
}

router.get('/', function (req, res) {
  let query = 'SELECT * FROM movies';

  const emessage = req.flash('error');
  const smessage = req.flash('success');
  const { genre } = req.query;
  if (genre) {
    // If a genre is provided in the query string, add a WHERE clause to filter by genre
    query = `SELECT * FROM movies WHERE genre = '${genre}'`;
  }

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    res.render('user/index', {
      movies: results,
      currentUser: req.user,
      smessage,
      emessage,
    });
  });
});

router.get('/search', function (req, res) {
  let query = 'SELECT * FROM movies';

  const { search } = req.query;

  if (search) {
    const searchTerm = search.toLowerCase(); // Convert the search term to lowercase

    // Check if the search term is a single character (first letter search)
    if (searchTerm.length === 1) {
      query += ` WHERE LOWER(title) LIKE '${searchTerm}%'`; // Search by the first letter of the title
    } else {
      query += ` WHERE LOWER(title) LIKE '%${searchTerm}%'`; // Search for movies containing the search query
    }
  }

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    res.render('user/moviesearch', { movies: results, currentUser: req.user });
  });
});

//get to the new_release page
router.get('/new-releases', function (req, res) {
  const query = 'SELECT * FROM movies WHERE status = "New Release";';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    res.render('user/newrelease', { movies: results, currentUser: req.user });
  });
});

//get to the up comming page
router.get('/up-coming', function (req, res) {
  const query = 'SELECT * FROM movies WHERE status = "UpComing";';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    res.render('user/upcoming', { movies: results, currentUser: req.user });
  });
});

router.get('/register', function (req, res) {
  res.render('user/register', { currentUser: req.user });
});

router.get('/login', function (req, res) {
  const successMessages = req.flash('success');
  const errorMessages = req.flash('error');
  res.render('user/login', {
    emessage: errorMessages,
    smessage: successMessages,
    currentUser: req.user,
  });
});

const error = [];

router.post('/register', registerValidation, function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      var errMsg = errors.mapped();
      var inputData = matchedData(req);
      res.render('user/register', {
        errors: errMsg,
        inputData: inputData,
        error: error,
        currentUser: req.user,
      });
    } else {
      const { name, email, password } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);

      // Check for duplicate email
      const checkQuery = `SELECT COUNT(*) AS count FROM users WHERE email = '${email}'`;
      connection.query(checkQuery, (error, results) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }
        const emailCount = results[0].count;
        if (emailCount > 0) {
          req.flash(
            'error',
            'Email Already Exists! Please use a different email.'
          );
          res.redirect('/login');
        } else {
          const query = `INSERT INTO users (username, email, password, role) VALUES ('${name}', '${email}', '${hashedPassword}', 'user')`;
          connection.query(query, (error, results) => {
            if (error) {
              req.flash('error', 'Something went wrong. Please try again.');
              res.redirect('/login');
            }
            req.flash(
              'success',
              'Registered successfully. Login Now to Book a Movie.'
            );
            res.redirect('/login');
          });
        }
      });
    }
  } catch (err) {
    console.log('Verification Invalid!!' + err);
    res.render('user/register', {
      currentUser: req.user,
      errorMessage: 'Something went wrong',
    });
  }
});

// Custom middleware to populate req.user
const authenticateUser = (req, res, next) => {
  if (req.session.user) {
    // If a user is authenticated, set req.user with user data
    req.user = req.session.user;
  } else {
    // If no user is authenticated, set req.user as undefined or handle as needed
    req.user = undefined;
  }
  next();
};

// Register the middleware before defining your routes
app.use(authenticateUser);

// router.post('/login', function (req, res) {
//   const email = req.body.email;

//   const userQuery = 'SELECT * FROM users WHERE email = ?';
//   connection.query(userQuery, [email], (error, results) => {
//     if (error) {
//       req.flash('error', 'Error validating user.');
//       res.redirect('/login');
//     } else {
//       // Check if any user was found
//       if (results && results.length > 0) {
//         const user = results[0];
//         if (user.role == 'super-admin') {
//           passport.authenticate('local')(req, res, function () {
//             req.flash('success', 'Logged in successfully as Super Admin.');
//             res.redirect('/sdashboard');
//           });
//         } else if (user.role == 'admin') {
//           passport.authenticate('local')(req, res, function () {
//             req.flash('success', 'Logged in successfully as Admin.');
//             res.redirect('adashboard');
//           });
//         } else {
//           passport.authenticate('local')(req, res, function () {
//             req.flash('success', 'Logged in successfully.');
//             res.redirect('/');
//           });
//         }
//       } else {
//         // No user found for the given email, display error message
//         req.flash('error', 'Invalid user credentials.');
//         res.redirect('/login');
//       }
//     }
//   });
// });

router.post('/login', function (req, res) {
  const email = req.body.email;
  const password = req.body.password; // Get the password provided by the user

  const userQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(userQuery, [email], (error, results) => {
    if (error) {
      console.error('Error validating user:', error);
      return res.status(500).send('Invalid User');
    } else {
      const user = results[0];
      if (!user || results.length === 0) {
        req.flash('error', 'User not found!');
        return res.redirect('/login');
      }

      // Compare the password provided by the user with the password stored in the database
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(500).send('Server Error');
        }

        if (isMatch) {
          // Passwords match, user is authenticated
          if (user.role === 'super-admin') {
            passport.authenticate('local')(req, res, function () {
              req.flash('success', 'Logged in successfully.');
              res.redirect('/sdashboard');
            });
          } else if (user.role === 'admin') {
            passport.authenticate('local')(req, res, function () {
              req.flash('success', 'Logged in successfully.');
              res.redirect('/adashboard');
            });
          } else {
            passport.authenticate('local')(req, res, function () {
              req.flash('success', 'Logged in successfully.');
              res.redirect('/');
            });
          }
        } else {
          req.flash('error', 'Invalid Passoword!');
          res.redirect('/login');
        }
      });
    }
  });
});

router.get('/my-bookings',isLoggedin, ensureuser, function (req, res) {
  const userId = req.user.id;
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  const query = `
    SELECT b.*, u.username, u.email, mh.name AS hall_name, mh.location AS hall_location, m.title AS movie_title
    FROM bookings AS b
    JOIN users AS u ON b.user_id = u.id
    JOIN movie_halls AS mh ON b.hall_id = mh.id
    JOIN movies AS m ON b.movie_id = m.id
    WHERE b.user_id = ${userId}
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

    res.render('user/myBookings', {
      bookings: formattedResults,
      currentUser: req.user,
      smessage,
      emessage,
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
  '/download-mybooking/:bookingId',
  isLoggedin,
  ensureuser,
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

router.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error('Error logging out:', err);
      return;
    }
    req.session.destroy(function (err) {
      if (err) {
        console.error('Error destroying session:', err);
        return;
      }
      res.redirect('/');
    });
  });
});

router.get('/forgot-password', function (req, res) {
  const smessage = req.flash('success');
  const emessage = req.flash('error');
  res.render('user/forgot-password', { errorMessage: '', smessage, emessage });
});

//Step 2: Implement email verification and send reset password link
router.post('/reset-password', function (req, res) {
  const email = req.body.email;

  // Check if the email exists in the database
  const checkQuery = `SELECT COUNT(*) AS count FROM users WHERE email = ?`;
  connection.query(checkQuery, [email], (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    const emailCount = results[0].count;
    if (emailCount === 0) {
      req.flash('error','Invalid email address');
      res.redirect('/forgot-password');
    } else {
      // Generate a unique token and store it in the database
      const token = generateToken(); // Call the generateToken() function here

      const updateQuery = `UPDATE users SET reset_token = ? WHERE email = ?`;
      connection.query(updateQuery, [token, email], (error, results) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }

        // Send the reset password email to the user

        var mailOptions = {
          from: process.env.auth_user,
          to: email,
          subject: 'FlickTix - Password Reset',
          html: `Click the following link to reset your password: http://10.70.91.60/Reset-password?token=${token}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log('Email error:', error);
          } else {
            req.flash(
              'success',
              'Reset link sent to your email. Please check and reset.'
            );
            res.redirect('/');
          }
        });
      });

      // Automatically clear the token after 5 minutes
      setTimeout(() => {
        const clearQuery = `UPDATE users SET reset_token = NULL WHERE email = ?`;
        connection.query(clearQuery, [email], (error, results) => {
          if (error) {
            console.error('Error executing the query: ', error);
          } else {
            console.log('Token cleared successfully.');
          }
        });
      }, 5 * 60 * 1000);
    }
  });
});

//Step 3: Create a reset password form
router.get('/Reset-password', function (req, res) {
  const token = req.query.token; // Get the token from the query parameters or wherever it is stored
  res.render('user/reset-password', { token, errorMessage: '' });
});

//Step 4: Update the user's password in the database
router.post(
  '/update-password',
  [
    check('token').notEmpty().withMessage('Token is required!'),
    check('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New Password is required!')
      .isLength({ min: 8 })
      .withMessage('New Password must be minimum 8 characters long')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('New Password should have at least one special character'),
    check('confirmPassword').custom((confirmPassword, { req }) => {
      const newPassword = req.body.newPassword;

      if (newPassword !== confirmPassword) {
        throw new Error('New Passwords must match.');
      }

      return true;
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);
      return res.render('user/reset-password', {
        token: req.body.token,
        errorMessage: errorMessages,
      });
    }

    const token = req.body.token;
    const newPassword = req.body.newPassword;

    // Lookup the user by the token in the database
    const userQuery = `SELECT * FROM users WHERE reset_token = ?`;
    connection.query(userQuery, [token], (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return;
      }
      if (results.length !== 0) {
        const userId = results[0].id;

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update the user's password in the database
        const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
        connection.query(
          updateQuery,
          [hashedPassword, userId],
          (error, results) => {
            if (error) {
              console.error('Error executing the query: ', error);
              return;
            }

            // Clear the reset_token field for the user
            const clearTokenQuery = `UPDATE users SET reset_token = null WHERE id = ?`;
            connection.query(clearTokenQuery, [userId], (error, results) => {
              if (error) {
                console.error('Error executing the query: ', error);
                return;
              }
              req.flash('success', 'Password reset successful. Login Now');
              res.redirect('/login');
            });
          }
        );
      } else {
        req.flash('error', 'Token Expired. Please try again.');
        res.redirect('/forgot-password');
      }
    });
  }
);

function generateToken() {
  // Generate a random string of characters for the token
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 20; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

module.exports = router;
