const { User, Reservation } = require('../models/Schemas');

// show login page
exports.showLogin = (req, res) => {
  res.render('user/login');
};

// show registration page
exports.showRegistration = (req, res) => {
  res.render('user/registration');
};

// show profile page
exports.showProfile = async (req, res) => {
  try {
        const email = req.query.email;
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.redirect('/user/login');
        }

        const reservations = await Reservation.find({ 
            reservedUnder: user._id,
            status: 'active'
        }).sort({createdAt: -1});

        res.render('user/profile', {
            user,
            reservations
        });
    } 
    catch (error) {
        console.error('Profile error:', error);
        res.redirect('/home');
    }
};

// show edit profile page
exports.showEditProfile = async (req, res) => {
  try {
        const email = req.query.email;
        
        const user = await User.findOne({email});
        
        if (!user) {
            return res.redirect('/user/login');
        }

        res.render('user/edit_profile', { 
            user,
            userEmail: email
        });
  } 
  catch (error) {
        console.error('Edit profile error:', error);
        res.redirect('/user/profile');
  }
};

// updates user profile
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email, description, originalEmail } = req.body;
        const findemail = originalEmail;

        await User.findOneAndUpdate(
            {email: findemail},
            { 
              firstName, 
              lastName, 
              email,
              description 
            }
        );
        res.redirect(`/user/profile?email=${encodeURIComponent(email)}`);
    }
    catch (error) {
        console.error('Error updating profile', error);
        res.redirect('/user/edit_profile');
    }
};

// process registration form
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
