const path = require("path");

//Login page

exports.getLoginForm = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "login.html"));
};

//Sign up page

exports.getForgotpass = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "forgotpass.html"));
};

exports.getResetpass = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "resetpass.html"));
};

exports.getSignupForm = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "register.html"));
};





// Home Page
exports.getHome = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "home.html"));
};

exports.getHome2 = (req, res) => {
  res.sendFile(path.join(__dirname, "../", "view", "home2.html"));
};


exports.getNewRelease = (req, res) => {
    res.sendFile(path.join(__dirname, "../", "views", "newrelease.html"));
  };
  

  exports.getUpcoming = (req, res) => {
    res.sendFile(path.join(__dirname, "../", "view", "upcomig.html"));
  };

exports.getDetails = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'view', 'details.html'))
    
  }
exports.getBooking = (req, res) => {
  res.sendFile(path.join(__dirname, '../', 'view', 'booking.html'))
  
}

exports.getSummary = (req, res) => {
  res.sendFile(path.join(__dirname, '../', 'view', 'summery.html'))
  
}

  exports.getBookingHistory = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'view', 'BookingHistory.html'))
    
  }


  exports.getRating = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'view', 'Rating.html'))
    
  }

  exports.getAction = (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'view', 'Action.html'))
    
  }