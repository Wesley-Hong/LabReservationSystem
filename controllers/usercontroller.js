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
        const profEmail = req.query.email;
        const viewerEmail = req.query.viewer;
        
        const user = await User.findOne({ email: profEmail });
        
        if (!user) {
            return res.redirect('/user/login');
        }

        const reservations = await Reservation.find({ 
            ReservedUnder: user._id,
            status: 'active'
        }).sort({createdAt: -1});

        const isUser = viewerEmail === profEmail;

        res.render('user/profile', {
            user,
            reservations, 
            isUser
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
        const {firstName, lastName, email, description, originalEmail, password} = req.body;
        const findemail = originalEmail;

        const updateData =
        { 
            firstName, 
            lastName, 
            email,
            description 
        };

        if (password && password.trim() !== '') {
            updateData.password = password;
        }
        await User.findOneAndUpdate(
            { email: findemail },
            updateData
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

// logs user out
exports.logoutUser = (req, res) => {
    res.redirect('/user/login');
};
