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

module.exports = router;
