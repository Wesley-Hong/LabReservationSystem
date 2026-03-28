const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');    

const app = express();
const PORT = 3000;

// MongoDB connection  
/* Edit the db */             
mongoose.connect('mongodb://127.0.0.1:27017')
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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// static files (CSS, JS, images)
app.use(express.static('public'));

// controllers
const userController = require('./controllers/usercontroller');
const reservationController = require('./controllers/reservationcontroller');

// API route to get available slots for a specific lab and date
app.get('/api/slots', reservationController.getSlots);

// API route to get reservation info for a specific slot  
app.get('/api/slotinfo', reservationController.getSlotInfo);

// route for student reservation to autofill form
app.get('/studentreserve', (req, res) => {
  const { lab, date, timeStart, timeEnd, seat } = req.query;
  res.render('reservation/studentreserve', {
    lab,
    date,
    timeStart,
    timeEnd,
    seat
  });
});

// dynamic profile page by user ID
app.get('/profile/:id', async (req, res) => {
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

    res.render('user/profile', {
      user,
      reservations,
      isUser: true  // optional, controls edit/logout buttons
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
app.get('/home', async (req, res) => {
  try {
    const { User } = require('./models/Schemas');
    const userEmail = req.query.email;
    const user = await User.findOne({ email: userEmail }).lean();

    res.render('home', {
      firstName: user ? user.firstName : '',
      lastName: user ? user.lastName : '',
      email: userEmail
    });
  } catch (err) {
    console.error(err);
    res.redirect('/user/login');
  }
});

// user routes
app.get('/user/login', userController.showLogin);
app.get('/user/registration', userController.showRegistration);
app.post('/user/registration', userController.registerUser);
app.get('/user/profile', userController.showProfile);
app.get('/user/edit_profile', userController.showEditProfile);
app.post('/user/login', userController.loginUser);
app.post('/user/update_profile', userController.updateProfile);
app.get('/user/logout', userController.logoutUser);

// reservation routes
app.get('/reservation/viewslots', reservationController.viewSlots);
app.get('/reservation/viewreservations', reservationController.viewReservations);
app.get('/reservation/studentreserve', reservationController.studentReserve);
app.get('/reservation/technicianreserve', reservationController.technicianReserve);
app.get('/reservation/editReservation', reservationController.editReservation);
app.post('/reservation/studentreserve', reservationController.createReservation);

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
