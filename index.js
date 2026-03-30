const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');    
const session = require('express-session');
const MongoStore = require('connect-mongo').MongoStore;
const app = express();
const MONGO_URI = 'mongodb://127.0.0.1:27017'; //change this to your MongoDB URI
const PORT = 3000;

// MongoDB connection  
/* Edit the db */             
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// handlebars setup
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    formatDate: function(date) {
      if (!date) return '';
      const d = new Date(date);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

app.set('view engine', 'hbs');
app.set('views', './views');

// middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI
  })
}));

app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    formatDate: function(date) { 
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
    },
    eq: function(a, b) {
      return a === b;
    }
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
}));

// session management middleware
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    next();
}

function requireRole(role) {
    return function(req, res, next) {
        if (!req.session.user || req.session.user.role !== role) {
            return res.status(403).send('Forbidden');
        }
        next();
    }
}

module.exports = { requireLogin, requireRole };

// Make session user available in templates
app.use((req, res, next) => {
    res.locals.user = req.session.user; // now HBS can access {{user}}
    next();
});

// static files (CSS, JS, images)
app.use(express.static('public'));

// controllers
const userController = require('./controllers/usercontroller');
const reservationController = require('./controllers/reservationcontroller');

// multer setup (upload profile pic)
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './public/images/',
  filename: (req, file, cb) => {
    cb(null, req.session.user._id + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API route to get available slots for a specific lab and date
app.get('/api/slots', reservationController.getSlots);

// API route to get reservation info for a specific slot  
app.get('/api/slotinfo', reservationController.getSlotInfo);

app.get('/reservation/booked', async (req, res) => {
  const { Lab , Reservation } = require('./models/Schemas');
  const { lab, date, timeStart } = req.query;

  const labDoc = await Lab.findOne({ labNum: lab });
  if (!labDoc) {
    return res.status(400).json({ error: 'Invalid lab number' });
  }

  try {
    if (!lab || !date) {
      return res.status(400).json({ error: "Missing lab or date" });
    }
    
    // Find the lab first, then find reservations for that lab, date, and time
    const query = {
      lab: labDoc._id,
      reservationDate: date,
      status: 'active'
    };

    query.lab = labDoc._id; // filter by lab ID

    // only filter by timeStart if provided
    if (timeStart) {
      query.timeStart = timeStart;
    }
    
    const reservations = await Reservation.find(query).lean();
    
    res.json(reservations); // return as JSON
  }

  catch (err) {
    res.status(500).json({ error: 'Failed to load reservations' });
  }
});

// dynamic profile page by user ID
app.get('/profile/:id', requireLogin, async (req, res) => {
  const { id } = req.params;
  const { User, Reservation, Lab } = require('./models/Schemas');

  try {
    // fetch user
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).send('User not found');

    // fetch reservations for this user and populate lab info
    const reservations = await Reservation.find({ ReservedUnder: id })
      .populate('lab')
      .lean();

    res.render('user/viewprofile', {
      user,
      reservations,
      isUser: req.session.user && req.session.user._id.toString() === user._id.toString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// start at login page
app.get('/', (req, res) => {
  res.redirect('/user/login');
});

// home page
app.get('/home', requireLogin, (req, res) => {
  // Pass user info to template
  res.render('home', {
    user: req.session.user,                   
    isStudent: req.session.user.role === 'student',
    isTechnician: req.session.user.role === 'technician'
  });
});

app.get('/about', userController.showAbout);

// user routes
app.get('/user/registration', userController.showRegistration);
app.get('/user/login', userController.showLogin);
app.get('/user/logout', userController.logoutUser);
app.get('/user/profile', requireLogin, userController.showProfile);
app.get('/user/edit_profile', requireLogin, userController.showEditProfile);

app.post('/user/registration', userController.registerUser);
app.post('/user/login', userController.loginUser);
app.post('/user/update_profile', requireLogin, userController.updateProfile);
app.post('/user/delete_account', requireLogin, userController.deleteUser);
app.post('/user/upload_picture', requireLogin, upload.single('profilePicture'), userController.uploadPicture);

// reservation routes
app.get('/reservation/viewslots', requireLogin, reservationController.viewSlots);
app.get('/reservation/viewreservations', requireLogin, reservationController.viewReservations);
app.get('/reservation/studentreserve',requireLogin, requireRole('student'), reservationController.studentReserve);
app.get('/reservation/technicianreserve', requireLogin, requireRole('technician'), reservationController.technicianReserve);
app.get('/reservation/editReservation/:id', requireLogin, reservationController.editReservation);
app.post('/reservation/cancel/:id', requireLogin, reservationController.cancelReservation);

app.post('/reservation/studentreserve', requireLogin, requireRole('student'), reservationController.createReservation);
app.post('/reservation/technicianreserve', requireLogin, requireRole('technician'), reservationController.createTechnicianReservation);
app.post('/reservation/editReservation/:id', requireLogin, reservationController.editTheReservation);
// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
