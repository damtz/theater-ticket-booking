// Import required dependencies
const express = require('express');
const app = express();
const { connection } = require('../database');
const router = express.Router();
const transporter = require('../config/email');

router.get('/addUser', (req, res) => {
  // Fetch theater data from the database
  const theaterQuery = 'SELECT * FROM movie_halls';
  connection.query(theaterQuery, (error, theaters) => {
    if (error) {
      console.error('Error fetching theaters:', error);
      return res.status(500).send('Internal Server Error');
    }
    res.render('super/addUser', { theaters });
  });
});

const bcrypt = require('bcrypt');

router.post('/add-admin', (req, res) => {
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
      return res.status(400).send('Email already exists');
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
            res.redirect('/userAdded');
          }
        });
      });
    });
  });
});

function generateRandomPassword() {
  const randomstring = require('randomstring');
  const password = randomstring.generate(8);
  return password;
}

module.exports = router;
