const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  firebaseUid: { 
    type: String, 
    required: true, 
    unique: true 
  }, // UID from Firebase Auth
  role: { 
    type: String, 
    enum: ['admin', 'leader', 'member'], 
    required: true 
  },
  assignedLeader: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  assignedMembers: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
