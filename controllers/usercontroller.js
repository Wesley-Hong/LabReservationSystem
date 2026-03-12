// show login page
exports.showLogin = (req, res) => {
  res.render('user/login');
};

// show registration page
exports.showRegistration = (req, res) => {
  res.render('user/registration');
};

// show profile page
exports.showProfile = (req, res) => {
  res.render('user/profile');
};

// show edit profile page
exports.showEditProfile = (req, res) => {
  res.render('user/edit_profile');
}

// process login form
exports.loginUser = (req, res) => {
  const { username, password } = req.body;

  console.log(username, password);

  res.redirect('/user/profile');
};