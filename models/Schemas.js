const mongoose = require('mongoose');

//Schema for user info
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'technician'],
        default: 'student'
    },
    description: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: 'default.png'
    }
}, { timestamps: true });

//Schema for labs
const labSchema = new mongoose.Schema({

    labNum: {
        type: String,
        required: true,
        unique: true
    },

    seats: {
        type: Number,
        default: 12
    }
});

//Schemma for reservations
const reserveSchema = new mongoose.Schema({

     ReservedUnder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    reservationDate: {
        type: String,   
        required: true
    },
    timeStart: {
        type: String, 
        required: true
    },
    timeEnd: {
        type: String,  
        required: true
    },
    timeSlotLabel: {
        type: String,  
        required: true
    },
    seatNumber: {
        type: Number,
        min: 1,
        max: 12
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed'],
        default: 'active'
    },
    requestDateTime: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true})

// error schema for demo
const errorSchema = new mongoose.Schema({
    alert: {
        type: String,
    },
    from: {
        type: String,
    },
    requestDateTime: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true})

// Export all models
module.exports = {
    User: mongoose.model('User', userSchema),
    Reservation: mongoose.model('Reservation', reserveSchema),
    Lab: mongoose.model('Lab', labSchema)

}
