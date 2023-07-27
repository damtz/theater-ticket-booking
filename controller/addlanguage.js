const express = require('express');
const app = express();
const router = express.Router();
const { connection, passport } = require('../database');

router.get('/add-language', function (req, res) {
    const query = 'SELECT * FROM languages';
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return;
      }
      const Languages = results.map((row) => Object.assign({}, row));
      
      res.render('admin/addlanguage', { Languages: Languages });
    });
  });
  

  router.post('/add-language', function (req, res) {
    const { languageName } = req.body;

    const query = `INSERT INTO languages (name) VALUES ('${languageName}')`;
    
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error executing the query: ', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      console.log('Language added successfully.');
      res.redirect('/add-language');
    });
});

  
  module.exports = router;
  