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

const { User } = require('../models/Schemas');

exports.registerUser = async (req, res) => {
    const { firstName, lastName, email, password, role } = req.body;

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        const user = new User({ firstName, lastName, email, password, role });
        await user.save();

        res.status(201).json({ message: 'Account created successfully!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // find user in DB
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: 'Email not found.' });
        }

        // check password (plain text for now, no hashing yet per Phase 2)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        // success
        res.status(200).json({ message: 'Login successful!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error.' });
    }
};