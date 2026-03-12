// show available lab slots
exports.viewSlots = (req, res) => {
  res.render('reservation/viewslots');
};

// show reservations page
exports.viewReservations = (req, res) => {
  res.render('reservation/viewreservations');
};

// show reservation form
exports.studentReserve = (req, res) => {
  res.render('reservation/studentreserve');
};

// show technician reservation page
exports.technicianReserve = (req, res) => {
  res.render('reservation/technicianreserve');
};

// show edit reservation page
exports.editReservation = (req, res) => {
  res.render('reservation/editReservation');
};