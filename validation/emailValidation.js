const { body } = require('express-validator');
const { checkEmailExists } = require('./validationUtils'); // Assuming you have a separate validation utility file

const validateEmail = body('email')
  .isEmail()
  .withMessage('Invalid email address.')
  .custom(checkEmailExists)
  .withMessage('Email already exists.');

module.exports = validateEmail;
