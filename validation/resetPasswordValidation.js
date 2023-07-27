const { check } = require('express-validator');

const resetPasswordValidation = [
  check('newPassword')
    .trim()
    .notEmpty()
    .withMessage('New Password is required!')
    .isLength({
      min: 8,
    })
    .withMessage('New Password must be minimum 8 characters long')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New Password should have at least one special character'),

  check('confirmPassword').custom(async (confirmPassword, { req }) => {
    const newPassword = req.body.newPassword;

    if (newPassword !== confirmPassword) {
      throw new Error('New Passwords must match.');
    }
  }),
];

module.exports = resetPasswordValidation;
