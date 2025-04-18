const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  job: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'Job', 
     required: true 
    },
  freelancer: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'User', required: true 
    },
  proposal: {
     type: String, 
     required: true 
    },
  amount: {
     type: Number, 
     required: true 
    },
  deliveryTime: {
     type: Number, 
     required: true 
    }, // in days
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Bid', bidSchema);
