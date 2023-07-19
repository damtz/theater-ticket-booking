const express = require("express");
const router = express.Router();
const viewsController = require("../controllers/viewsController");


router.get("/", viewsController.getHome);
router.get("/home2", viewsController.getHome2);
router.get("/login", viewsController.getLoginForm);
router.get("/signup", viewsController.getSignupForm);
router.get("/forgotpass", viewsController.getForgotpass);
router.get("/resetpass", viewsController.getResetpass);
router.get("/newrelease", viewsController.getNewRelease);
router.get("/upcoming", viewsController.getUpcoming);
router.get("/details", viewsController.getDetails);
router.get("/booking", viewsController.getBooking);
router.get("/bookinghistory", viewsController.getBookingHistory);
router.get("/summary", viewsController.getSummary);
router.get("/rating", viewsController.getRating);
router.get("/action", viewsController.getAction);

module.exports = router;

