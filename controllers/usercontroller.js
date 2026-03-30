const { User, Reservation } = require('../models/Schemas');
const bcrypt = require ('bcrypt');

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
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    const user = await User.findById(userSession._id).lean();
    if (!user) return res.redirect('/user/login');

    const reservations = await Reservation.find({ 
        ReservedUnder: user._id,
        status: 'active'
    }).sort({ createdAt: -1 }).populate('lab').lean();

    res.render('user/profile', {
        user,
        reservations,
        isUser: true  // always the logged-in user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.redirect('/home');
  }
};

// show edit profile page
exports.showEditProfile = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    const user = await User.findById(userSession._id).lean();
    if (!user) return res.redirect('/user/login');

    res.render('user/edit_profile', { 
        user,
        userEmail: user.email
    });
  } catch (error) {
    console.error('Edit profile error:', error);
    res.redirect('/user/profile');
  }
};

// updates user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, description, password } = req.body;
    const userId = req.session.user._id;

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ field: 'firstName', error: 'First name is required.' });
    }
    if (!lastName || !lastName.trim()) {
      return res.status(400).json({ field: 'lastName', error: 'Last name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ field: 'email', error: 'Email is required.' });
    }
    if (!email.endsWith('@dlsu.edu.ph')) {
      return res.status(400).json({ field: 'email', error: 'Please use a DLSU email.' });
    }

    const existing = await User.findOne({ email, _id: { $ne: userId } });
    if (existing) {
      return res.status(409).json({ field: 'email', error: 'Email is already in use.' });
    }
    
    const updateData = { firstName, lastName, email, description };
    if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await User.findByIdAndUpdate(userId, updateData);

    // update session info if email or name changed
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;
    req.session.user.email = email;

    res.status(200).json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating profile', error);
    res.status(500).json({ error: 'Server error. Please try again.' });
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

        const hashing= await bcrypt.hash(password, 10);

        const user = new User({ firstName, lastName, email, password: hashing, role });
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
        
        const matching= await bcrypt.compare(password, user.password)
        // added hashing
        if (!matching) {
            return res.status(401).json({ error: 'Incorrect password.' });
        }

        // success
        req.session.user = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        };
        res.status(200).json({ message: 'Login successful!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error.' });
    }
};

// logs user out
exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) console.error(err);
        res.redirect('/user/login');
    });
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Destroy session FIRST before deleting from DB
    req.session.destroy(async (err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.redirect('/user/profile');
      }

      try {
        await Reservation.deleteMany({ ReservedUnder: userId });
        await User.findByIdAndDelete(userId);
        res.redirect('/user/login');
      } catch (dbErr) {
        console.error('Delete account error:', dbErr);
        res.redirect('/user/login'); // session is gone anyway
      }
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.redirect('/user/profile');
  }
};

exports.showAbout = (req, res) => {
  const npmPackages = [
    { name: "express", version: "^5.2.1", description: "Web framework" },
    { name: "express-handlebars", version: "^8.0.6", description: "Template engine" },
    { name: "mongoose", version: "^9.3.0", description: "MongoDB ODM" },
    { name: "bcrypt", version: "^6.0.0", description: "Password hashing" },
    { name: "express-session", version: "^1.19.0", description: "Session management" },
    { name: "connect-mongo", version: "^6.0.0", description: "MongoDB session store" },
    { name: "multer", version: "^2.1.1", description: "File upload" },
    { name: "mongodb", version: "^7.1.0", description: "MongoDB driver" }
  ];

  res.render('about', { 
    npmPackages,
    user: req.session.user || null
  });
};
