const mongoose = require('mongoose');
const { Schema } = mongoose;

const reportSchema = new Schema({
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  project: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  tasks: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Task' 
  }],
  summary: { 
    type: String, 
    default: '' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  emailSent: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
