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
     type: Date, 
     required: true 
    }, 
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Bid', bidSchema);
