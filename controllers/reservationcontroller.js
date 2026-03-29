const { Lab, Reservation } = require('../models/Schemas');

exports.viewReservations = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/user/login');

    const reservations = await Reservation.find({
      ReservedUnder: userSession._id,
      status: 'active'
    })
      .populate('lab')
      .populate('ReservedUnder')
      .lean();

    res.render('reservation/viewreservations', { reservations, user: userSession });
  } catch (err) {
    console.error(err);
    res.render('reservation/viewreservations', { reservations: [], user: req.session.user });
  }
};

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

exports.technicianReserve = (req, res) => {
  const userSession = req.session.user;
  if (!userSession) return res.redirect('/user/login');

  res.render('reservation/technicianreserve', { user: userSession });
};


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
  }
};

exports.createReservation = async (req, res) => {
  const { Reservation } = require('../models/Schemas');
  const userSession = req.session.user;
  if (!userSession) return res.status(401).json({ error: 'Unauthorized' });

  const { lab, reservationDate, isAnonymous, selectedSeatsByTime } = req.body;
  const reservationsToInsert = [];

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
          lab,
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
          lab,
          reservationDate,
          timeStart: timeStart,
          timeEnd: timeEnd,
          timeSlotLabel: `${timeStart} - ${timeEnd}`,
          seatNumber: s,
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
  }
};

exports.createTechnicianReservation = async (req, res) => {
  res.send('Technician reservation not implemented yet');
};

exports.viewSlots = async (req, res) => {
  try {
    const labs = await Lab.find().lean();
    res.render('reservation/viewslots', { labs, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.render('reservation/viewslots', { labs: [], user: req.session.user });
  }
};

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

exports.studentReservePrefill = (req, res) => {
  const { lab, date, timeStart, timeEnd, seat } = req.query;
  res.render('reservation/studentreserve', { lab, date, timeStart, timeEnd, seat, user: req.session.user });
};