const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String },
  password: String,
  role: { type: String, enum: ['client', 'freelancer'], default: 'freelancer' },
  otp: { type: Number, default: null },
  photo: {
        type: String
    },
  country:{
    type:String
  }
}, { timestamps: true, versionKey: false });

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);
