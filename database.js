// const mysql = require('mysql');

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'movie_booking',
//   connectionLimit: 10,
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to the database: ', err);
//     return;
//   }
//   console.log('Connected to the database');
// });

// module.exports = connection;
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'movie_booking',
  connectionLimit: 10,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database');
});

// Table creation query
const createMovieHallsTable = `
CREATE TABLE IF NOT EXISTS movie_halls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL
)`;

connection.query(createMovieHallsTable, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
});

// const createMovies = `CREATE TABLE movies (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   title VARCHAR(255) NOT NULL,
//   movie_hall VARCHAR(255) NOT NULL,
//   hall_id INT,
//   FOREIGN KEY (hall_id) REFERENCES movie_halls(id)
// )`;

// connection.query(createMovies, (err) => {
//   if (err) {
//     console.error('Error creating movie_halls table: ', err);
//     return;
//   }
//   console.log('Movie table');
// });

// Configure the LocalStrategy for username and password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (email, password, done) => {
      // Check if the email and password match the user in the MySQL database
      const query = 'SELECT * FROM users WHERE email = ?';
      connection.query(query, [email], (error, results) => {
        if (error) {
          return done(error);
        }

        if (results.length === 0) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const user = results[0];
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (!passwordMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // If the authentication is successful, pass the user object to the done callback
        done(null, user);
      });
    }
  )
);

// Optional: Serialize and deserialize the authenticated user
passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  // Fetch the user from the MySQL database using the id
  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (error, results) => {
    if (error) {
      return done(error);
    }

    const user = results[0];
    done(null, user);
  });
});

module.exports = { connection, passport };
