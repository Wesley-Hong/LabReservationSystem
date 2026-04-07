const { Lab, Reservation, User, ErrorModel } = require('../models/Schemas'); // Comment out ErrorModel if needed

// Students view their own reservation
// Technician can view everyones reservation
exports.viewReservations = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    let reservations;

    if (userSession.role === 'student') {
      // Student sees only their own reservations
      reservations = await Reservation.find({
        ReservedUnder: userSession._id,
        status: 'active'
      })
      .populate('lab')
      .populate('ReservedUnder')
      .lean();
    } else if (userSession.role === 'technician') {
      // Technician sees reservations of all students
      const studentIds = await User.find({ role: 'student' }).select('_id').lean();
      const studentIdArray = studentIds.map(s => s._id);

      reservations = await Reservation.find({
        ReservedUnder: { $in: studentIdArray },
        status: 'active'
      })
      .populate('lab')
      .populate('ReservedUnder')
      .lean();
    } else {
      // Other roles not allowed
      return res.status(403).send('Access denied');
    }

    res.render('reservation/viewreservations', { reservations, user: userSession });
  } catch (err) {
    console.error(err);
    res.render('reservation/viewreservations', { reservations: [], user: req.session.user });
  }
};

//Reservation page for student
exports.studentReserve = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    res.render('reservation/studentreserve', { user: userSession });
  } catch (err) {
    console.error(err);
    res.render('reservation/studentreserve', { user: req.session.user });
  }
};

// Reservation page for technician
exports.technicianReserve = (req, res) => {
  const userSession = req.session.user;
  if (!userSession) return res.redirect('/user/login');

  res.render('reservation/technicianreserve', { user: userSession });
};

// Renders the edit reservation form
exports.editReservation = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    const reservation = await Reservation.findById(req.params.id)
      .populate('lab')
      .populate('ReservedUnder')
      .lean();

    if (!reservation) return res.redirect('/reservation/viewreservations');

    res.render('reservation/editReservation', { reservation, user: userSession });
  } catch (err) {
    console.error(err);
    res.redirect('/reservation/viewreservations');
    const error = new ErrorModel({
      alert: 'Error loading reservation for editing',
      from: 'exports.editReservation',
      requestDateTime: new Date()
    });
    await error.save();
  }
};

// Remove old reservation data and add the updated data
exports.editTheReservation = async (req, res) => {
    const { Reservation, Lab, ErrorModel } = require('../models/Schemas');
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');
    
    const { lab, reservationDate, selectedSeatsByTime } = req.body;
    const labDoc = await Lab.findOne({ labNum: lab });
    
    let newReservations = [];

    if (!labDoc) {
      return res.status(400).json({ error: 'Invalid lab number' });
    }

    const labId = labDoc._id;

    try {

      // Ensure the reservation belongs to the user and is active
      const oldReservation = await Reservation.findById(req.params.id).populate('lab').populate('ReservedUnder').lean();
      if (!oldReservation) {
        return res.status(404).send('Reservation not found');
      }

      if (userSession.role === 'student' && (!oldReservation.ReservedUnder || oldReservation.ReservedUnder._id.toString() !== userSession._id.toString())) {
        return res.status(403).send('Unauthorized');
      }

      const add30Min = (time) => {
        const [hour, minute] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hour, minute + 30);
        return date.toTimeString().slice(0, 5);
      }

      for (const timeStart in selectedSeatsByTime) {
        const seats = selectedSeatsByTime[timeStart];
        const timeEnd = add30Min(timeStart);

        for (let seat of seats) {
          const seatNum = Number(seat);
          const existing = await Reservation.findOne({
            lab: labId,
            reservationDate,
            timeStart,
            timeEnd,
            seatNumber: seatNum,
            status: 'active',
            _id: { $ne: oldReservation._id }, // exclude the old reservation
          });

          if (existing) {
            return res.status(409).json({ error: `Slot ${timeStart}-${timeEnd} for seat ${seatNum} is already reserved.` });
          }

          let ReservedUnderID = null;

          if (userSession.role === 'student') {
            ReservedUnderID = userSession._id;
          } else if (userSession.role === 'technician') {
            ReservedUnderID = oldReservation.ReservedUnder._id; // keep the same student for technician edits
          }

          newReservations.push(new Reservation({
            ReservedUnder: ReservedUnderID,
            lab: labId,
            reservationDate,
            timeStart: timeStart,
            timeEnd: timeEnd,
            timeSlotLabel: `${timeStart} - ${timeEnd}`,
            seatNumber: seatNum,
            isAnonymous: oldReservation.isAnonymous,
            status: 'active',
            requestDateTime: new Date()
          }));
        }
      }

      await Reservation.findByIdAndDelete(req.params.id); // delete the old reservation
      await Reservation.insertMany(newReservations); // insert the new reservations

      res.status(200).json({ message: 'Reservation updated successfully' });
    }
      
  catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error in editing the reservation' });
      const error = new ErrorModel({
        alert: 'Server error in editing the reservation',
        from: 'exports.editTheReservation',
        requestDateTime: new Date()
      });
      await error.save();
  }
}

// Create new reservation (student)
exports.createReservation = async (req, res) => {
  const { Reservation, Lab, ErrorModel } = require('../models/Schemas');
  const userSession = req.session.user;
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });

  const { lab, reservationDate, isAnonymous, selectedSeatsByTime } = req.body;
  const reservationsToInsert = [];

  const labDoc = await Lab.findOne({ labNum: lab });
  if (!labDoc) {
    return res.status(400).json({ error: 'Invalid lab number' });
  }

  const labId = labDoc._id;

  try {
    const add30Min = (time) => {
      const [hour, minute] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hour, minute + 30);
      return date.toTimeString().slice(0, 5);
    };

    if (!selectedSeatsByTime || typeof selectedSeatsByTime !== 'object') {
      return res.status(400).json({ error: 'Invalid seat selection data' });
    }

    for (let timeStart in selectedSeatsByTime) {
      const seats = selectedSeatsByTime[timeStart];
      const timeEnd = add30Min(timeStart);
      for (let s of seats) {
        
        const seatNum = Number(s);
        const existing = await Reservation.findOne({
          lab: labId,
          reservationDate,
          timeStart: timeStart,
          timeEnd: timeEnd,
          seatNumber: seatNum,
          status: 'active'
        });

        if (existing) {
          return res.status(409).json({ error: `Slot ${timeStart}-${timeEnd} for seat ${seatNum} is already reserved.` });
        }

        reservationsToInsert.push(new Reservation({
          ReservedUnder: userSession._id,
          lab: labId,
          reservationDate,
          timeStart: timeStart,
          timeEnd: timeEnd,
          timeSlotLabel: `${timeStart} - ${timeEnd}`,
          seatNumber: seatNum,
          isAnonymous,
          status: 'active',
          requestDateTime: new Date()
        }));
      }
    }

    await Reservation.insertMany(reservationsToInsert);
    res.status(201).json({ message: 'Reservation created successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
    const error = new ErrorModel({
      alert: 'Server error in creating reservation',
      from: 'exports.createReservation',
      requestDateTime: new Date()
    });
    await error.save();
  }
};

// Technician will help student make reservation
exports.createTechnicianReservation = async (req, res) => {
  const userSession = req.session.user;

  if (!userSession || userSession.role !== 'technician') 
      return res.status(401).json({ error: 'Unauthorized' });

  const { lab, reservationDate, selectedSeatsByTime, studentEmail } = req.body;

  if (!studentEmail) {
      return res.status(400).json({ error: 'Student email is required' });
  }

  // Find the student
  const student = await User.findOne({ email: studentEmail, role: 'student' });
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const reservationsToInsert = [];
  const labDoc = await Lab.findOne({ labNum: lab });
  if (!labDoc) return res.status(400).json({ error: 'Invalid lab number' });

  const labId = labDoc._id;

  try {
      const add30Min = (time) => {
          const [hour, minute] = time.split(':').map(Number);
          const date = new Date();
          date.setHours(hour, minute + 30);
          return date.toTimeString().slice(0, 5);
      };

      for (let timeStart in selectedSeatsByTime) {
          const seats = selectedSeatsByTime[timeStart];
          const timeEnd = add30Min(timeStart);

          for (let s of seats) {
              const seatNum = Number(s);

              const existing = await Reservation.findOne({
                  lab: labId,
                  reservationDate,
                  timeStart,
                  timeEnd,
                  seatNumber: seatNum,
                  status: 'active'
              });

              if (existing) {
                  return res.status(409).json({ error: `Slot ${timeStart}-${timeEnd} for seat ${seatNum} is already reserved.` });
              }

              reservationsToInsert.push(new Reservation({
                  ReservedUnder: student._id,
                  lab: labId,
                  reservationDate,
                  timeStart,
                  timeEnd,
                  timeSlotLabel: `${timeStart} - ${timeEnd}`,
                  seatNumber: seatNum,
                  isAnonymous: false,
                  status: 'active',
                  requestDateTime: new Date()
              }));
          }
      }

      await Reservation.insertMany(reservationsToInsert);
      res.status(201).json({ message: 'Reservation created successfully' });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
};

// Student cancel their own reservation
// Technician need to wait for 10 min for to cancel
exports.cancelReservation = async (req, res) => {
  const { Reservation } = require('../models/Schemas');
  const userSession = req.session.user;
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const reservation = await Reservation.findById(req.params.id).populate('lab');
    if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

    if (userSession.role === 'technician') {
      const now = new Date();
      const reservationDate = reservation.reservationDate;
      const timeStart = reservation.timeStart;       
      const [datePart] = reservationDate.split('T');
      const startDateTime = new Date(`${datePart} ${timeStart}`);
      const diffMinutes = (now - startDateTime) / 1000 / 60;

      if (diffMinutes < 0 || diffMinutes > 10) {
        return res.status(403).json({ error: 'You can only cancel a reservation within 10 minutes of its start time.' });
      }
    }
    
    if (userSession.role === 'student') {
      if (reservation.ReservedUnder.toString() !== userSession._id.toString()) {
        return res.status(403).json({ error: 'You can only cancel your own reservations.' });
      }
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.status(200).json({ message: 'Reservation cancelled successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

// View all reservation slot (available or occupied)
exports.viewSlots = async (req, res) => {
  try {
    const userSession = req.session.user;
    const labs = await Lab.find().lean();
    res.render('reservation/viewslots', { labs, user: userSession, userRole: userSession?.role });
  } catch (err) {
    console.error(err);
    res.render('reservation/viewslots', { labs: [], user: req.session.user });
  }
};

// API: returns all reservation (lab and date)
exports.getSlots = async (req, res) => {
  const { lab: labNum, date } = req.query;

  try {
    const lab = await Lab.findOne({ labNum });
    if (!lab) return res.json([]);

    const reservations = await Reservation.find({
      lab: lab._id,
      reservationDate: date
    }).lean();

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load slots' });
  }
};

// APIL return reservation info (lab, date, time, and seat)
exports.getSlotInfo = async (req, res) => {
  const { lab: labNum, date, timeStart, timeEnd, seat } = req.query;

  try {
    const lab = await Lab.findOne({ labNum });
    if (!lab) return res.status(404).json({ error: 'Lab not found' });

    const reservation = await Reservation.findOne({
      lab: lab._id,
      reservationDate: date,
      timeStart,
      timeEnd,
      seatNumber: seat
    }).populate('ReservedUnder');

    if (!reservation) return res.status(404).json({ error: 'No reservation found' });

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
