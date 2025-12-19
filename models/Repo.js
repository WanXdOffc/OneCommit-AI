import mongoose from 'mongoose';

const RepoSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  githubUrl: {
    type: String,
    required: [true, 'GitHub URL is required'],
    trim: true,
    match: [/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/, 'Invalid GitHub repository URL']
  },
  owner: {
    type: String,
    required: true,
    trim: true
  },
  repoName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  language: {
    type: String,
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  defaultBranch: {
    type: String,
    default: 'main'
  },
  totalCommits: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  lastCommitAt: {
    type: Date,
    default: null
  },
  webhookId: {
    type: String,
    default: null
  },
  webhookActive: {
    type: Boolean,
    default: false
  },
  stats: {
    additions: {
      type: Number,
      default: 0
    },
    deletions: {
      type: Number,
      default: 0
    },
    filesChanged: {
      type: Number,
      default: 0
    },
    averageQuality: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
RepoSchema.index({ event: 1, user: 1 });
RepoSchema.index({ fullName: 1 });
RepoSchema.index({ owner: 1 });
RepoSchema.index({ totalScore: -1 });

// Virtual for GitHub API URL
RepoSchema.virtual('apiUrl').get(function() {
  return `https://api.github.com/repos/${this.fullName}`;
});

// Virtual for commits URL
RepoSchema.virtual('commitsUrl').get(function() {
  return `${this.apiUrl}/commits`;
});

// Virtual for average score per commit
RepoSchema.virtual('averageScore').get(function() {
  if (this.totalCommits === 0) return 0;
  return (this.totalScore / this.totalCommits).toFixed(2);
});

// Methods
RepoSchema.methods.updateStats = async function(commit) {
  this.totalCommits += 1;
  this.totalScore += commit.qualityScore || 0;
  this.stats.additions += commit.stats.additions || 0;
  this.stats.deletions += commit.stats.deletions || 0;
  this.stats.filesChanged += commit.stats.filesChanged || 0;
  this.lastCommitAt = commit.timestamp;
  
  // Calculate average quality
  this.stats.averageQuality = this.totalScore / this.totalCommits;
  
  await this.save();
};

RepoSchema.methods.activateWebhook = async function(webhookId) {
  this.webhookId = webhookId;
  this.webhookActive = true;
  await this.save();
};

RepoSchema.methods.deactivateWebhook = async function() {
  this.webhookActive = false;
  await this.save();
};

// Static methods
RepoSchema.statics.findByEvent = function(eventId) {
  return this.find({ event: eventId, isActive: true })
    .populate('user', 'name email githubUsername')
    .sort({ totalScore: -1 });
};

RepoSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, isActive: true })
    .populate('event', 'name status')
    .sort({ createdAt: -1 });
};

RepoSchema.statics.findByGithubUrl = function(githubUrl) {
  return this.findOne({ githubUrl });
};

RepoSchema.statics.getLeaderboard = function(eventId, limit = 10) {
  return this.find({ event: eventId, isActive: true })
    .populate('user', 'name email githubUsername avatar')
    .sort({ totalScore: -1 })
    .limit(limit);
};

export default mongoose.models.Repo || mongoose.model('Repo', RepoSchema);