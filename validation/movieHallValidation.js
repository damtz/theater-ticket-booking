const { check } = require('express-validator');

const movieHallValidation = [
  check('name').trim().notEmpty().withMessage('Hall Name is required!'),
  check('normalCapacity')
    .notEmpty()
    .withMessage('Normal Capacity is required!')
    .isInt({ min: 1 })
    .withMessage('Normal Capacity must be a positive integer'),
  check('vipCapacity')
    .notEmpty()
    .withMessage('VIP Capacity is required!')
    .isInt({ min: 1 })
    .withMessage('VIP Capacity must be a positive integer'),
  check('normalRate')
    .notEmpty()
    .withMessage('Normal Rate is required!')
    .isNumeric({ min: 0 })
    .withMessage('Normal Rate must be a non-negative number'),
  check('vipRate')
    .notEmpty()
    .withMessage('VIP Rate is required!')
    .isNumeric({ min: 0 })
    .withMessage('VIP Rate must be a non-negative number'),
];

module.exports = movieHallValidation;
