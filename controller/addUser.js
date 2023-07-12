// Import required dependencies
const express = require('express');
const app = express();
const { connection } = require('../database');
const router = express.Router();

// Define route to render the addUser page
router.get('/addUser', (req, res) => {
  // Fetch theater data from the database
  const theaterQuery = 'SELECT * FROM movie_halls';
  connection.query(theaterQuery, (error, theaters) => {
    if (error) {
      console.error('Error fetching theaters:', error);
      return res.status(500).send('Internal Server Error');
    }

    // Render the addUser page and pass the theater data
    res.render('super/addUser', { theaters });
  });
});

// Define route to handle the POST request and add the user
router.post('/addUser', (req, res) => {
  const { username, email, password, assignedTheater } = req.body;

  // Perform validation and error handling

  // Insert the user data into the database
  const insertUserQuery =
    'INSERT INTO users (username, email, password, assigned_theater_id) VALUES (?, ?, ?, ?)';
  const values = [username, email, password, assignedTheater];
  connection.query(insertUserQuery, values, (error, results) => {
    if (error) {
      console.error('Error inserting user:', error);
      return res.status(500).send('Internal Server Error');
    }

    // User added successfully
    res.redirect('/');
  });
});

module.exports = router;
