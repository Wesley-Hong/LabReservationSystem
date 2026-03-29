const mongoose = require('mongoose');
const { User, Lab, Reservation } = require('./models/Schemas'); // adjust path if needed

const MONGO_URI = 'mongodb://127.0.0.1:27017'; 

const users = [
    {
        firstName: 'Juan',
        lastName: 'Cruz',
        email: 'juan_cruz@dlsu.edu.ph',
        password: 'password123',
        role: 'student',
        description: 'CS student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Maria',
        lastName: 'Clara',
        email: 'maria_clara@dlsu.edu.ph',
        password: 'password123',
        role: 'student',
        description: 'IT student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Jose',
        lastName: 'Rizal',
        email: 'jose_rizal@dlsu.edu.ph',
        password: 'password123',
        role: 'student',
        description: 'Math student',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Ana',
        lastName: 'Gomez',
        email: 'ana_gomez@dlsu.edu.ph',
        password: 'password123',
        role: 'student',
        description: 'BM student at DLSU',
        profilePicture: 'default.png'
    },
    {
        firstName: 'Carlos',
        lastName: 'Tech',
        email: 'carlos_tech@dlsu.edu.ph',
        password: 'password123',
        role: 'technician',
        description: 'Lab technician',
        profilePicture: 'default.png'
    }
];

const labs = [
    { labNum: 'Computer Lab 01', seats: 12 },
    { labNum: 'Computer Lab 02', seats: 12 },
    { labNum: 'Computer Lab 03', seats: 12 },
];

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
                timeStart: '8:00AM',
                timeEnd: '8:30AM',
                timeSlotLabel: '8:00AM - 8:30AM',
                seatNumber: 1,
                isAnonymous: false,
                status: 'active'
            },
            {
                ReservedUnder: insertedUsers[1]._id,
                lab: insertedLabs[1]._id,
                reservationDate: '2026-04-01',
                timeStart: '9:00AM',
                timeEnd: '9:30AM',
                timeSlotLabel: '9:00AM - 9:30AM',
                seatNumber: 3,
                isAnonymous: false,
                status: 'active'
            },
            {
                ReservedUnder: insertedUsers[2]._id,
                lab: insertedLabs[2]._id,
                reservationDate: '2026-03-30',
                timeStart: '10:30AM',
                timeEnd: '11:00AM',
                timeSlotLabel: '10:30AM - 11:00AM',
                seatNumber: 5,
                isAnonymous: true,
                status: 'completed'
            },
            {
                ReservedUnder: insertedUsers[3]._id,
                lab: insertedLabs[0]._id,
                reservationDate: '2026-03-30',
                timeStart: '1:30PM',
                timeEnd: '2:00PM',
                timeSlotLabel: '1:30PM - 2:00PM',
                seatNumber: 7,
                isAnonymous: false,
                status: 'cancelled'
            },
            {
                ReservedUnder: insertedUsers[4]._id,
                lab: insertedLabs[2]._id,
                reservationDate: '2026-03-30',
                timeStart: '2:30PM',
                timeEnd: '3:00PM',
                timeSlotLabel: '2:30PM - 3:00PM',
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