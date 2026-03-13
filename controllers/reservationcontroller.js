const { Lab, Reservation } = require('../models/Schemas'); // import both models


// Show reservations page
exports.viewReservations = (req, res) => {
  res.render('reservation/viewreservations');
};

// Show reservation form
exports.studentReserve = (req, res) => {
  res.render('reservation/studentreserve');
};

// Show technician reservation page
exports.technicianReserve = (req, res) => {
  res.render('reservation/technicianreserve');
};

// Show edit reservation page
exports.editReservation = (req, res) => {
  res.render('reservation/editReservation');
};

// API: Get slots for a specific lab and date
exports.getSlots = async (req, res) => {
  const { lab: labNum, date } = req.query; // labNum = "Computer Lab 01"

  try {
    // Find the lab object first
    const lab = await Lab.findOne({ labNum: labNum });
    if (!lab) return res.json([]); // no lab found

    // Query reservations for this lab and date
    const reservations = await Reservation.find({
      lab: lab._id,
      reservationDate: date
    }).lean();

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load slots" });
  }
};

// show available lab slots page 
exports.viewSlots = async (req, res) => {
  try {
    const labs = await Lab.find().lean(); // fetch all labs from DB
    res.render('reservation/viewslots', { labs }); // pass to HBS
  } catch (err) {
    console.error(err);
    res.render('reservation/viewslots', { labs: [] }); // fallback
  }
};

// for prefilling student reservation form from view slots page
exports.studentReservePrefill = (req, res) => {
    const { lab, date, timeStart, timeEnd, seat } = req.query;
    res.render('reservation/studentreserve', { lab, date, timeStart, timeEnd, seat });
};

// get reservation info for a specific slot ---
exports.getSlotInfo = async (req, res) => {
    const { lab: labNum, date, timeStart, timeEnd, seat } = req.query;

    try {
        // Find the lab first
        const lab = await Lab.findOne({ labNum: labNum });
        if (!lab) return res.status(404).json({ error: 'Lab not found' });

        // Find the reservation for this specific slot
        const reservation = await Reservation.findOne({
            lab: lab._id,
            reservationDate: date,
            timeStart,
            timeEnd,
            seatNumber: seat
        }).populate('ReservedUnder'); // populate user info

        if (!reservation) {
            return res.status(404).json({ error: 'No reservation found' });
        }

        res.json(reservation);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};