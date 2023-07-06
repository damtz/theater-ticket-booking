const { check, sanitizedBody } = require('express-validator');

const registerValidation = [
  //Full Name validation
  check('name').trim().notEmpty().withMessage('Full Name is required!'),
  //Email || email validation
  check('email')
    .notEmpty()
    .withMessage('Email Address is required!')
    .normalizeEmail()
    .isEmail()
    .withMessage('Email address must be valid'),
  //Password validation
  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required!')
    .isLength({
      min: 8,
    })
    .withMessage('Password must be minimum 8 characters long')

    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('your password should have at least one sepcial character'),

  check('confirmPassword').custom(async (confirmPassword, { req }) => {
    const password = req.body.password;

    if (password !== confirmPassword) {
      throw new Error('Password must be same.');
    }
  }),
];

module.exports = registerValidation;
