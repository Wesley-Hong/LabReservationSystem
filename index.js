const express = require('express');
const exphbs = require('express-handlebars');

const app = express();
const PORT = 3000;

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


app.get('/', (req, res) => {
  res.redirect('/home');
});

// --------------------
// Home
// --------------------
app.get('/home', (req, res) => {
  res.render('home', {
    firstName: "Student",
    lastName: "User"
  });
});


// --------------------
// User routes
// --------------------
app.get('/user/login', (req, res) => {
  res.render('user/login');
});

app.get('/user/registration', (req, res) => {
  res.render('user/registration');
});

app.get('/user/profile', (req, res) => {
  res.render('user/profile');
});

app.get('/user/edit_profile', (req, res) => {
  res.render('user/edit_profile');
});


// --------------------
// Reservation routes
// --------------------
app.get('/reservation/viewslots', (req, res) => {
  res.render('reservation/viewslots');
});

app.get('/reservation/viewreservations', (req, res) => {
  res.render('reservation/viewreservations');
});

app.get('/reservation/studentreserve', (req, res) => {
  res.render('reservation/studentreserve');
});

app.get('/reservation/technicianreserve', (req, res) => {
  res.render('reservation/technicianreserve');
});

app.get('/reservation/editReservation', (req, res) => {
  res.render('reservation/editReservation');
});


// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});