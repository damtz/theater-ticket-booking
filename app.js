// /** @format */

const express = require("express");
const app = express();

const viewRouter = require('./routes/viewRoutes')
const path = require("path");


app.use('/', viewRouter)
app.use(express.static(path.join(__dirname, 'views')))
module.exports = app


app.listen(3000, function () {
  console.log("App running on port 3000 ..");
});


app.use(express.static(path.join(__dirname, 'view')))
module.exports = app

