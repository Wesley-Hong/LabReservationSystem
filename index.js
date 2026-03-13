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
  extname: '.hbs'
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

app.get('/api/slots', reservationController.getSlots);

// start at login page
app.get('/', (req, res) => {
  res.redirect('/user/login');
});

// home page
app.get('/home', (req, res) => {
  const userEmail = req.query.email;
  res.render('home', {
    firstName: "Student",
    lastName: "User",
    email: userEmail
  });
});

// user routes
app.get('/user/login', userController.showLogin);
app.get('/user/registration', userController.showRegistration);
app.post('/user/registration', userController.registerUser);
app.get('/user/profile', userController.showProfile);
app.get('/user/edit_profile', userController.showEditProfile);
app.post('/user/login', userController.loginUser);

// reservation routes
app.get('/reservation/viewslots', reservationController.viewSlots);
app.get('/reservation/viewreservations', reservationController.viewReservations);
app.get('/reservation/studentreserve', reservationController.studentReserve);
app.get('/reservation/technicianreserve', reservationController.technicianReserve);
app.get('/reservation/editReservation', reservationController.editReservation);


// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
