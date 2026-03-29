const { Lab, Reservation } = require('../models/Schemas'); // import both models

// Show reservations page
exports.viewReservations = async (req, res) => {
  try {
    const { User, Reservation } = require('../models/Schemas');

    const userEmail = req.query.email;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.render('reservation/viewreservations', { reservations: [] });
    }

    const reservations = await Reservation.find({
      ReservedUnder: user._id,
      status: 'active'
    })
    .populate('lab')
    .populate('ReservedUnder')
    .lean();

    res.render('reservation/viewreservations', { reservations });

  } catch (err) {
    console.error(err);
    res.render('reservation/viewreservations', { reservations: [] });
  }
};

/*
// Show reservation form
exports.studentReserve = async (req, res) => {
  try{
    const { User , Reservation } = require('../models/Schemas');
    const { lab, date } = req.query;
    const reservations = await Reservation.find({
      lab: lab,
      reservationDate: date,
      status: 'active'
    }).populate('lab').populate('ReservedUnder').lean(); // fetch all active reservations with lab and user info

    res.render('reservation/studentreserve', { reservations });
  } catch (err) {
    console.error(err);
    res.render('reservation/studentreserve', { reservations: [] }); // fallback to empty array on error
  }
};
*/

// Show reservation form (rendering the page without fetching reservations)
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

// Get slots for a specific lab and date
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

exports.createReservation = async (req, res) => {
    // This function would handle form submission for creating a reservation
    // You would extract form data from req.body, validate it, check for conflicts, and save to DB

    const { User , Reservation } = require('../models/Schemas');
    
    // const { ReservedUnder, lab, reservationDate, timeStart, timeEnd, timeSlotLabel, seatNumber, isAnonymous, status, requestDateTime } = req.body;
    // For handling multiple time slots and seats, we can expect timeStart and seatNumber to be arrays
    const { lab, reservationDate, selectedSeatsByTime, isAnonymous } = req.body;
    const reservationsToInsert = [];

    try {

        if (!lab || !reservationDate || !selectedSeatsByTime) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (Object.keys(selectedSeatsByTime).length === 0) {
          return res.status(400).json({ error: "No time slots selected" });
        }

        const add30Min = (time) => {
          const [hour, minute] = time.split(':').map(Number);
          const date = new Date();
          date.setHours(hour, minute + 30);
          return date.toTimeString().slice(0, 5);
        }
        
        for (let timeStart in selectedSeatsByTime) {
          const seats = selectedSeatsByTime[timeStart];
          const timeEnd = add30Min(timeStart);
          
          if (!Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ error: "No seats selected" });
          }
          
          for (let seat of seats) {
            const existing = await Reservation.findOne({
              lab,
              reservationDate,
              timeStart,
              timeEnd: timeEnd,
              seatNumber: seat,
              status: 'active'
            });
            if (existing) {
              return res.status(409).json({ error: `Slot ${timeStart}-${timeEnd} for seat ${seat} is already reserved.` });
            }

            const newReservation = new Reservation({
              ReservedUnder: req.user._id,
              lab,
              reservationDate,
              timeStart,
              timeEnd: timeEnd, 
              timeSlotLabel: `${timeStart} - ${timeEnd}`, 
              seatNumber: seat, 
              isAnonymous, 
              status: 'active', 
              requestDateTime: new Date()});

            reservationsToInsert.push(newReservation);
        }
      }
      await Reservation.insertMany(reservationsToInsert);
      res.status(201).json({ message: 'Reservation created successfully', count: reservationsToInsert.length });
      console.log(req.body); // Log the form data to the console for debugging

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

}

