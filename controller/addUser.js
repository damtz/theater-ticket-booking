// Import required dependencies
const express = require('express');
const app = express();
const { connection } = require('../database');
const router = express.Router();
const transporter = require('../config/email');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    req.currentUser = req.user;
    next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
};
function ensuresuperadmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'super-admin') {
    // If the user is logged in and has the role "user," proceed to the next middleware or route handler
    return next();
  } else {
    req.flash('error','Yor are not Authorized..')
    res.redirect('/login');
  }
}

router.get('/addUser', isLoggedin,ensuresuperadmin, (req, res) => {
  // Fetch theater data from the database
  const theaterQuery = 'SELECT * FROM movie_halls';
  const smessage = req.flash('success');
  const emessage = req.flash('error');

  connection.query(theaterQuery, (error, theaters) => {
    if (error) {
      console.error('Error fetching theaters:', error);
      return res.status(500).send('Internal Server Error');
    }
    res.render('super/addUser', {
      theaters,
      smessage,
      emessage,
      currentUser: req.user,
      currentPage: 'user',
    });
  });
});

const bcrypt = require('bcrypt');

router.post('/add-admin', isLoggedin, (req, res) => {
  const { username, email, assignedTheater } = req.body;

  const randomPassword = generateRandomPassword();
  console.log('Password:', randomPassword);

  const hashedPassword = bcrypt.hashSync(randomPassword, 10);

  const userQuery = 'SELECT * FROM users WHERE email = ?';
  connection.query(userQuery, [email], (error, results) => {
    if (error) {
      console.error('Error validating user:', error);
      return res.status(500).send('Internal Server Error');
    }

    if (results.length > 0) {
      req.flash(
        'error',
        'Email already exists. Please try with different Email.'
      );
      return res.redirect('/addUser'); // Return here to stop further execution
    }

    const insertUserQuery =
      'INSERT INTO users (username, email, role, password, assigned_theater_id) VALUES (?, ?, ?, ?, ?)';
    const values = [username, email, 'admin', hashedPassword, assignedTheater];
    connection.query(insertUserQuery, values, (error, results) => {
      if (error) {
        console.error('Error inserting user:', error);
        return res.status(500).send('Internal Server Error');
      }

      const theaterQuery = 'SELECT name FROM movie_halls WHERE id = ?';
      connection.query(theaterQuery, [assignedTheater], (error, results) => {
        if (error) {
          console.error('Error fetching theater:', error);
          return res.status(500).send('Internal Server Error');
        }

        if (results.length === 0) {
          return res.status(404).send('Assigned theater not found');
        }

        const theaterName = results[0].name;

        var mailOptions = {
          from: process.env.auth_user,
          to: req.body.email,
          subject: 'FlickTix - Admin Registration',
          html:
            'from: ' +
            process.env.auth_user +
            ', <h3>Hello ' +
            req.body.username +
            ' You are assigned as admin for ' +
            theaterName +
            ' with email: ' +
            req.body.email +
            ' and password: ' +
            randomPassword +
            '<br> Thank you.</a>',
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log('Email error:', error);
          } else {
            req.flash('success', 'Admin added successfully.');
            res.redirect('/user');
          }
        });
      });
    });
  });
});

// GET route to render the user update form
router.get('/userUpdate/:id', isLoggedin,ensuresuperadmin, function (req, res) {
  const userId = req.params.id;

  const userQuery = `SELECT * from users where id = ${userId}`;

  connection.query(userQuery, (error, userResults) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Internal server error');
    }

    const user = userResults[0];

    // Query to fetch the list of theaters
    const theatersQuery = `SELECT * FROM movie_halls`;

    connection.query(theatersQuery, (error, theaters) => {
      if (error) {
        console.log(error);
        return res.status(500).send('Internal server error');
      }

      // Render the editUser template with the user and theaters data
      res.render('super/editUser', { user, theaters, currentUser: req.user,  currentPage: 'user', });
    });
  });
});

router.post('/userUpdate/:id', isLoggedin,ensuresuperadmin, function (req, res) {
  const userId = req.params.id;
  console.log(userId);
  const { username, email, assignedTheater } = req.body;

  // Update the movie details
  const updateQuery = `
    UPDATE users
    SET username='${username}', email='${email}', assigned_theater_id='${assignedTheater}' WHERE id=${userId}
  `;

  connection.query(updateQuery, (error, results) => {
    if (error) {
      req.flash('error', 'User update failed!');
      res.redirect('/user');
    } else {
      req.flash('success', 'User updated successfully.');
      res.redirect('/user');
    }
  });
});

router.get('/userDelete/:id', isLoggedin,ensuresuperadmin, function (req, res) {
  const userId = req.params.id;

  const deleleQuerry = 'DELETE FROM users WHERE id= ?';

  connection.query(deleleQuerry, [userId], (error, result) => {
    if (error) {
      console.log(error);
    } else {
      req.flash('success', 'User deleted successfully!');
      res.redirect('/user');
    }
  });
});

function generateRandomPassword() {
  const randomstring = require('randomstring');
  const password = randomstring.generate(8);
  return password;
}

module.exports = router;
