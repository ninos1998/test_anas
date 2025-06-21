const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin','editor','writer'],
    default: 'user'
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  const expiresIn = isNaN(process.env.JWT_EXPIRE) 
    ? process.env.JWT_EXPIRE 
    : Number(process.env.JWT_EXPIRE);

  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn } // Format correct
  );
};

module.exports = mongoose.model('User', userSchema);