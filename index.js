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
app.post('/reservation/save', reservationController.createReservation);

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});