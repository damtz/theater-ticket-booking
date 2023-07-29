
const mysql = require("mysql");
const app = require("./app");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "movieticket",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Successfully connected to database");
});



const createUserTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  assigned_theater_id INT,
  FOREIGN KEY (assigned_theater_id) REFERENCES movie_halls(id)
)`;

connection.query(createUserTable, (err) => {
  if (err) {
    console.error('Error creating users table: ', err);
    return;
  }
  console.log("Successfully created users");
});

// Table creation query
const createMovieHallsTable = `CREATE TABLE IF NOT EXISTS movie_halls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  normal_capacity INT NOT NULL,
  vip_capacity INT NOT NULL,
  normal_rate DECIMAL(10, 2) NOT NULL,
  vip_rate DECIMAL(10, 2) NOT NULL,
  status BOOLEAN NOT NULL
)`;

connection.query(createMovieHallsTable, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
  console.log('Successfully created movie hall')
});
module.exports = connection;
