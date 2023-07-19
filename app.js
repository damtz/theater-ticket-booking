/** @format */

// imports

const express = require("express");
const app = express();
const path = require("path");
const port = 3000;

// Static Files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/img", express.static(__dirname + "public/img"));

// set views
app.set("views", "./views");
app.set("view engine", "ejs");

// app.set('views', path.join(__dirname, "views"));
//
app.get("", (req, res) => {
  res.render("index");
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});



app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/forgotpass", (req, res) => {
  res.render("forgotpass");
});

app.get("/resetpass", (req, res) => {
  res.render("resetpass");
});

app.get("/newrelease", (req, res) => {
  res.render("newrelease");
});

app.get("/upcoming", (req, res) => {
  res.render("upcoming");
});

app.get("/booking", (req, res) => {
  res.render("booking");
});

app.get("/details", (req, res) => {
  res.render("details");
});

app.get("/summary", (req, res) => {
  res.render("summary");
});

app.get("/bookinghistory", (req, res) => {
  res.render("bookinghistory");
});

app.get("/rating", (req, res) => {
  res.render("rating");
});
app.get("/moviedetails", (req, res) => {
  res.render("moviedetails");
});


// listen on port
app.listen(port, () => console.info(`Listening on port ${port}`));
