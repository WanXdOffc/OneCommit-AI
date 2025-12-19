import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'participant'],
    default: 'participant'
  },
  githubUsername: {
    type: String,
    trim: true,
    default: null
  },
  discordId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  totalCommits: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ githubUsername: 1 });
UserSchema.index({ discordId: 1 });

// Virtual for user stats
UserSchema.virtual('averageScore').get(function() {
  if (this.totalCommits === 0) return 0;
  return (this.totalScore / this.totalCommits).toFixed(2);
});

// Methods
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

UserSchema.methods.updateStats = async function(commits, score) {
  this.totalCommits += commits;
  this.totalScore += score;
  await this.save();
};

// Static methods
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findAdmins = function() {
  return this.find({ role: 'admin', isActive: true });
};

export default mongoose.models.User || mongoose.model('User', UserSchema);