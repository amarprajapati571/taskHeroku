const mongoose = require('mongoose');

const user = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },

    otp: {
        type: String
    },
    otpUsed:{
        type:Boolean,
        default:false
    },
    otpExpire:{
        type:Boolean,
        default:false
    },
    otpPass: {
        type: Number,
        default:0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    genrateOtpTime: { type: Date,default:Date.now},
    suspendedTime:{type: Date, default: Date.now},
    genrateOtpExpire:{type:Date,default:Date.now}

});

module.exports = new mongoose.model('User', user);