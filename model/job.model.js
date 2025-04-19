const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
     type: String, 
     required: true 
    },
  description: {
     type: String, 
     required: true 
    },
  skills: [
    {
    type: String, 
    required: true 
    }
],
  budget: {
     type: Number, 
     required: true 
    },
  deadline: {
     type: Date, 
     required: true 
    },
  status: {
    type: String,
    enum: ['open' , 'in progress', 'completed'],
    default: 'open',
  },
  client: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'User', 
     required: true 
    },
  acceptedBid: {
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'Bid', 
     default: null 
    },
  isDeleted: {
    type: Boolean,
    default: false,
  }}, 
     { timestamps: true, versionKey: false });

module.exports = mongoose.model('Job', jobSchema);
