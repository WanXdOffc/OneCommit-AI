import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    minlength: [3, 'Event name must be at least 3 characters'],
    maxlength: [200, 'Event name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Max participants is required'],
    min: [1, 'Must allow at least 1 participant'],
    max: [1000, 'Cannot exceed 1000 participants']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    repo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repo'
    }
  }],
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
    max: [720, 'Duration cannot exceed 30 days']
  },
  status: {
    type: String,
    enum: ['waiting', 'running', 'finished', 'cancelled'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  rules: {
    minCommits: {
      type: Number,
      default: 1
    },
    allowedLanguages: [{
      type: String
    }],
    requireTests: {
      type: Boolean,
      default: false
    }
  },
  prizes: [{
    rank: Number,
    title: String,
    description: String
  }],
  totalCommits: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  discordChannelId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
EventSchema.index({ status: 1 });
EventSchema.index({ startTime: 1 });
EventSchema.index({ endTime: 1 });
EventSchema.index({ createdBy: 1 });

// Virtual for remaining slots
EventSchema.virtual('remainingSlots').get(function() {
  return this.maxParticipants - this.currentParticipants;
});

// Virtual for is full
EventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for is active
EventSchema.virtual('isActive').get(function() {
  return this.status === 'running';
});

// Methods
EventSchema.methods.canJoin = function() {
  return this.status === 'waiting' && !this.isFull;
};

EventSchema.methods.addParticipant = async function(userId, repoId) {
  if (!this.canJoin()) {
    throw new Error('Cannot join this event');
  }
  
  const alreadyJoined = this.participants.some(
    p => p.user.toString() === userId.toString()
  );
  
  if (alreadyJoined) {
    throw new Error('Already joined this event');
  }
  
  this.participants.push({
    user: userId,
    repo: repoId,
    joinedAt: new Date()
  });
  
  this.currentParticipants += 1;
  await this.save();
};

EventSchema.methods.startEvent = async function() {
  if (this.status !== 'waiting') {
    throw new Error('Event already started or finished');
  }
  
  this.status = 'running';
  this.startTime = new Date();
  this.endTime = new Date(Date.now() + this.duration * 60 * 60 * 1000);
  await this.save();
};

EventSchema.methods.finishEvent = async function() {
  if (this.status !== 'running') {
    throw new Error('Event is not running');
  }
  
  this.status = 'finished';
  await this.save();
};

EventSchema.methods.isExpired = function() {
  if (!this.endTime) return false;
  return new Date() > this.endTime;
};

// Static methods
EventSchema.statics.findActive = function() {
  return this.find({ status: 'running' });
};

EventSchema.statics.findWaiting = function() {
  return this.find({ status: 'waiting' });
};

EventSchema.statics.findFinished = function() {
  return this.find({ status: 'finished' }).sort({ endTime: -1 });
};

export default mongoose.models.Event || mongoose.model('Event', EventSchema);