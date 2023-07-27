const express = require('express');
const app = express();
const router = express.Router();
const { connection } = require('../database');

const isLoggedin = function (req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/sdashboard', isLoggedin, function (req, res) {
  res.render('super/dashboard', { currentUser: req.user });
});

router.get('/movieHalls', function (req, res) {
  const hallQuerry = 'SELECT * FROM movie_halls';

  connection.query(hallQuerry, (error, movieHalls) => {
    if (error) {
      console.log(error);
    }
    res.render('super/movieHalls', { halls: movieHalls });
  });
});

router.get('/hallUpdate/:id', function (req, res) {
  const hallid = req.params.id;

  const hallQuerry = 'SELECT * FROM movie_halls WHERE id = ?';
  connection.query(hallQuerry, [hallid], (error, result) => {
    if (error) {
      console.log(error);
    } else {
      const hall = result[0];
      res.render('super/hallUpdate', { hall: hall });
    }
  });
});

router.post('/hallUpdate/:id', function (req, res) {
  const hallId = req.params.id;

  const {
    name,
    location,
    normal_capacity,
    vip_capacity,
    normal_rate,
    vip_rate,
  } = req.body;

  const updateQuerry = `UPDATE movie_halls SET name='${name}', location='${location}', normal_capacity='${normal_capacity}', 
      vip_capacity='${vip_capacity}', normal_rate='${normal_rate}', vip_rate='${vip_rate}' WHERE id= ?`;
  connection.query(updateQuerry, [hallId], (error, results) => {
    if (error) {
      console.log(err);
    } else {
      console.log('Movie added successfully.');
      res.redirect('/movieHalls');
    }
  });
});

router.get('/hallDelete/:id', function (req, res) {
  const hallId = req.params.id;

  const deleleQuerry = 'DELETE FROM movie_halls WHERE id= ?';

  connection.query(deleleQuerry, [hallId], (error, result) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Deleted Successfully');
      res.redirect('/movieHalls');
    }
  });
});

module.exports = router;
