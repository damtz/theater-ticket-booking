const { check } = require('express-validator');

const movieHallValidation = [
  check('name').trim().notEmpty().withMessage('Name is required!'),
  check('location').trim().notEmpty().withMessage('Location is required!'),
  check('capacity')
    .notEmpty()
    .withMessage('Seating capacity is required!')
    .isInt({ min: 1 })
    .withMessage('Seating capacity must be a positive integer'),
];

module.exports = movieHallValidation;
