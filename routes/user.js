const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');
const { validationResult, matchedData } = require('express-validator');
const registerValidation = require('../validation/registerValidation');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

router.get('/', function (req, res) {
  const query = 'SELECT * FROM movie_halls';

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    const Halls = results.map((row) => Object.assign({}, row));
    res.render('user/index', { Halls: Halls, currentUser: req.user });
  });
});

router.get('/register', function (req, res) {
  res.render('user/register');
});

router.get('/login', function (req, res) {
  res.render('user/login', { errorMessage: '' });
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
          console.log('Email already exists.');
          res.render('user/register', {
            errorMessage: 'Email already exists.',
          });
        } else {
          const query = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${hashedPassword}')`;
          connection.query(query, (error, results) => {
            if (error) {
              console.error('Error executing the query: ', error);
              return;
            }
            console.log('Data inserted successfully.');
            res.redirect('/');
          });
        }
      });
    }
  } catch (err) {
    console.log('Verification Invalid!!' + err);
    res.render('user/register', { errorMessage: 'Something went wrong' });
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

// Define the route handler for the login page
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
  })
);

router.get('/logout', (req, res) => {
  // Logout the user and destroy the session
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

// router.get('/forgot-password', function(req, res) {
//   res.render('user/forgot-password',{ errorMessage: '' });
// });

// router.post('/reset-password', function(req, res) {
//   const email = req.body.email;
//   const newPassword = req.body.newPassword;

//   // Check if the email exists in the database
//   const checkQuery = `SELECT COUNT(*) AS count FROM users WHERE email = '${email}'`;
//   connection.query(checkQuery, (error, results) => {
//     if (error) {
//       console.error('Error executing the query: ', error);
//       return;
//     }
//     const emailCount = results[0].count;
//     if (emailCount === 0) {
//       res.render('user/forgot-password', {
//         errorMessage: 'Invalid email address.'
//       });
//     } else {
//       // Hash the new password
//       const hashedPassword = bcrypt.hashSync(newPassword, 10);

//       // Update the user's password in the database
//       const updateQuery = `UPDATE users SET password = '${hashedPassword}' WHERE email = '${email}'`;
//       connection.query(updateQuery, (error, results) => {
//         if (error) {
//           console.error('Error executing the query: ', error);
//           return;
//         }
//         console.log('Password reset successfully.');
//         res.redirect('/login');
//       });
//     }
//   });
// });
// Step 1: Add a "Forgot Password" link on the login page
router.get('/forgot-password', function(req, res) {
  res.render('user/forgot-password', { errorMessage: '' });
});

// Step 2: Implement email verification and send reset password link
router.post('/reset-password', function(req, res) {
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
      res.render('user/forgot-password', {
        errorMessage: 'Invalid email address.'
      });
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
        sendResetPasswordEmail(email, token); // Call the sendResetPasswordEmail() function here

        console.log('Reset password email sent successfully.');
        res.render('user/forgot-password', {
          errorMessage: 'An email with instructions has been sent to your email address.'
        });
      });
    }
  });
});

// Step 3: Create a reset password form
router.get('/Reset-password', function(req, res) {
  const token = req.query.token; // Get the token from the query parameters or wherever it is stored
  res.render('user/reset-password', { token, errorMessage: '' });
});

// // Step 4: Update the user's password in the database
// router.post('/update-password', function(req, res) {
//   const token = req.body.token;
//   const newPassword = req.body.newPassword;

//   // Lookup the user by the token in the database
//   const userQuery = `SELECT * FROM users WHERE reset_token = ?`;
//   connection.query(userQuery, [token], (error, results) => {
//     if (error) {
//       console.error('Error executing the query: ', error);
//       return;
//     }
//     if (results.length === 0) {
//       res.render('user/reset-password', { token, errorMessage: 'Invalid or expired token.' });
//     } else {
//       const userId = results[0].id;
//       // Hash the new password
//       const hashedPassword = bcrypt.hashSync(newPassword, 10);

//       // Update the user's password in the database
//       const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
//       connection.query(updateQuery, [hashedPassword, userId], (error, results) => {
//         if (error) {
//           console.error('Error executing the query: ', error);
//           return;
//         }
//         console.log('Password reset successfully.');

//         // Clear the reset_token field for the user
//         const clearTokenQuery = `UPDATE users SET reset_token = null WHERE id = ?`;
//         connection.query(clearTokenQuery, [userId], (error, results) => {
//           if (error) {
//             console.error('Error executing the query: ', error);
//             return;
//           }
//           console.log('Reset token cleared.');
//           res.redirect('/login');
//         });
//       });
//     }
//   });
// });
router.post('/update-password', function(req, res) {
  const token = req.body.token;
  const newPassword = req.body.newPassword;

  // Lookup the user by the token in the database
  const userQuery = `SELECT * FROM users WHERE reset_token = ?`;
  connection.query(userQuery, [token], (error, results) => {
    if (error) {
      console.error('Error executing the query: ', error);
      return;
    }
    if (results.length !== 0) { // Inverted the condition using !==
      const userId = results[0].id;
      // Hash the new password
      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      // Update the user's password in the database
      const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
      connection.query(updateQuery, [hashedPassword, userId], (error, results) => {
        if (error) {
          console.error('Error executing the query: ', error);
          return;
        }
        console.log('Password reset successfully.');

        // Clear the reset_token field for the user
        const clearTokenQuery = `UPDATE users SET reset_token = null WHERE id = ?`;
        connection.query(clearTokenQuery, [userId], (error, results) => {
          if (error) {
            console.error('Error executing the query: ', error);
            return;
          }
          console.log('Reset token cleared.');
          res.redirect('/login');
        });
      });
    } else {
      res.render('user/reset-password', { token, errorMessage: 'Invalid or expired token.' });
    }
  });
});


// Implement generateToken() function here
function generateToken() {
  // Generate a random string of characters for the token
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 20; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

const nodemailer = require('nodemailer');

async function sendResetPasswordEmail(email, token) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: true, // enable secure connection
      auth: {
        user: '12190095.gcit@rub.edu.bt', // replace with your email address
        pass: '17980119@tshering' // replace with your email password
      }
    });

    const mailOptions = {
      from: '12190042.gcit@gcit.edu.bt', // replace with your email address
      to: email,
      subject: 'Reset Your Password',
      text: `Click the following link to reset your password: http://localhost:3000/Reset-password?token=${token}`
      // You can customize the email content as per your requirements
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Reset password email sent successfully. Message ID:', info.messageId);
  } catch (error) {
    throw new Error('Error sending email: ' + error.message);
  }
}


module.exports = router;
