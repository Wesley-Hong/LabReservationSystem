const mongoose = require('mongoose');
const { User, Lab, Reservation } = require('./models/Schemas'); // adjust path if needed

const MONGO_URI = 'mongodb://127.0.0.1:27017'; 

// sample user: 4 students, 2 techicians, password are pre-harshed with bcrypt
const users = [
    {
        firstName: 'Juan',
        lastName: 'Cruz',
        email: 'juan_cruz@dlsu.edu.ph',
        password: '$2a$12$PyhXvRQ1BCUCMbwYchwDuOfvSOyuq4C3PUhUbZTOujbQ6v9g2YvAS',
        role: 'student',
        description: 'CS student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Maria',
        lastName: 'Clara',
        email: 'maria_clara@dlsu.edu.ph',
        password: '$2a$12$PyhXvRQ1BCUCMbwYchwDuOfvSOyuq4C3PUhUbZTOujbQ6v9g2YvAS',
        role: 'student',
        description: 'IT student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Jose',
        lastName: 'Rizal',
        email: 'jose_rizal@dlsu.edu.ph',
        password: '$2a$12$v5R7GLSwJEvKqa4hOPsXr.fFPBEjlImuv774cjPfhZ46n8mkNULMC',
        role: 'student',
        description: 'Math student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Ana',
        lastName: 'Gomez',
        email: 'ana_gomez@dlsu.edu.ph',
        password: '$2a$12$v5R7GLSwJEvKqa4hOPsXr.fFPBEjlImuv774cjPfhZ46n8mkNULMC',
        role: 'student',
        description: 'BM student at DLSU',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Carlos',
        lastName: 'Tech',
        email: 'carlos_tech@dlsu.edu.ph',
        password: '$2a$12$v5R7GLSwJEvKqa4hOPsXr.fFPBEjlImuv774cjPfhZ46n8mkNULMC',
        role: 'technician',
        description: 'Lab technician',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Zen',
        lastName: 'Coluso',
        email: 'zen_coluso@dlsu.edu.ph',
        password: '$2a$12$PyhXvRQ1BCUCMbwYchwDuOfvSOyuq4C3PUhUbZTOujbQ6v9g2YvAS',
        role: 'technician',
        description: 'please work',
        profilePicture: 'default.png'
    }
];

// 3 labs and 12 seats each
const labs = [
    { labNum: 'Computer Lab 01', seats: 12 },
    { labNum: 'Computer Lab 02', seats: 12 },
    { labNum: 'Computer Lab 03', seats: 12 },
];

// Clears exisitng data and insert new sample data
async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected');

        // Clear existing data
        await User.deleteMany({});
        await Lab.deleteMany({});
        await Reservation.deleteMany({});
        console.log('Cleared existing data');

        // Insert users and labs
        const insertedUsers = await User.insertMany(users);
        const insertedLabs  = await Lab.insertMany(labs);
        console.log('Users and Labs inserted');

        // Reservations reference real inserted IDs
        const reservations = [
            {
                ReservedUnder: insertedUsers[0]._id,
                lab: insertedLabs[0]._id,
                reservationDate: '2026-04-01',
                timeStart: '8:00',
                timeEnd: '08:30',
                timeSlotLabel: '8:00 - 08:30',
                seatNumber: 1,
                isAnonymous: false,
                status: 'active'
            },
            {
                ReservedUnder: insertedUsers[1]._id,
                lab: insertedLabs[1]._id,
                reservationDate: '2026-04-01',
                timeStart: '9:00',
                timeEnd: '09:30',
                timeSlotLabel: '9:00 - 09:30',
                seatNumber: 3,
                isAnonymous: false,
                status: 'active'
            },
            {
                ReservedUnder: insertedUsers[2]._id,
                lab: insertedLabs[2]._id,
                reservationDate: '2026-03-30',
                timeStart: '10:30',
                timeEnd: '11:00',
                timeSlotLabel: '10:30 - 11:00',
                seatNumber: 5,
                isAnonymous: true,
                status: 'completed'
            },
            {
                ReservedUnder: insertedUsers[3]._id,
                lab: insertedLabs[0]._id,
                reservationDate: '2026-03-30',
                timeStart: '13:30',
                timeEnd: '14:00',
                timeSlotLabel: '13:30 - 14:00',
                seatNumber: 7,
                isAnonymous: false,
                status: 'cancelled'
            },
            {
                ReservedUnder: insertedUsers[3]._id,
                lab: insertedLabs[2]._id,
                reservationDate: '2026-03-30',
                timeStart: '14:30',
                timeEnd: '15:00',
                timeSlotLabel: '14:30 - 15:00',
                seatNumber: 10,
                isAnonymous: false,
                status: 'active'
            }
        ];

        await Reservation.insertMany(reservations);
        console.log('Reservations inserted');

        console.log('Seeding complete!');
        process.exit(0);

    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedDatabase();
