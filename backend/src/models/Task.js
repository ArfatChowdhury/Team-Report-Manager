const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  project: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  assignedTo: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  assignedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'pause', 'done'], 
    default: 'todo' 
  },
  startedAt: { 
    type: Date, 
    default: null 
  },
  completedAt: { 
    type: Date, 
    default: null 
  },
  timeTracked: { 
    type: Number, 
    default: 0 
  }, // time in minutes
  isCarryOver: { 
    type: Boolean, 
    default: false 
  },
  originalTask: { 
    type: Schema.Types.ObjectId, 
    ref: 'Task', 
    default: null 
  },
  dueDate: { 
    type: Date, 
    default: null 
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
