/** @format */

const express = require("express");
const app = express();
const router = express.Router();

router.get("/", function (req, res) {
  res.render("home");
});

router.get("/login", function (req, res) {
  res.render("login");
});
router.get("/register", function (req, res) {
  res.render("register");
});

exports.router = router;
