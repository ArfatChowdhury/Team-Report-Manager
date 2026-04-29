const mongoose = require('mongoose');
const { Schema } = mongoose;

const projectSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  visibleTo: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  order: { 
    type: Number, 
    default: 0 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
