
const mysql = require("mysql");
const app = require("./app");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Damber123.",
  database: "movie_booking",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Successfully connected to database");
});


module.exports = connection;
