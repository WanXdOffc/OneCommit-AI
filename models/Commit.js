import mongoose from 'mongoose';

const CommitSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  repo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sha: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  message: {
    type: String,
    required: true
  },
  author: {
    name: String,
    email: String,
    username: String,
    avatar: String
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
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
    total: {
      type: Number,
      default: 0
    },
    filesChanged: {
      type: Number,
      default: 0
    }
  },
  files: [{
    filename: String,
    status: String,
    additions: Number,
    deletions: Number,
    changes: Number,
    patch: String
  }],
  aiAnalysis: {
    processed: {
      type: Boolean,
      default: false
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isSpam: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ['feature', 'bugfix', 'refactor', 'docs', 'test', 'chore', 'other'],
      default: 'other'
    },
    summary: {
      type: String,
      default: null
    },
    feedback: {
      type: String,
      default: null
    },
    suggestions: [{
      type: String
    }],
    technologies: [{
      type: String
    }],
    complexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  score: {
    base: {
      type: Number,
      default: 0
    },
    quality: {
      type: Number,
      default: 0
    },
    timing: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  isValid: {
    type: Boolean,
    default: true
  },
  flags: {
    isLateSubmission: {
      type: Boolean,
      default: false
    },
    isFirstCommit: {
      type: Boolean,
      default: false
    },
    isLargeCommit: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
CommitSchema.index({ event: 1, timestamp: -1 });
CommitSchema.index({ repo: 1, timestamp: -1 });
CommitSchema.index({ user: 1, timestamp: -1 });
CommitSchema.index({ 'aiAnalysis.qualityScore': -1 });
CommitSchema.index({ 'score.total': -1 });

// Virtual for is processed
CommitSchema.virtual('isProcessed').get(function() {
  return this.aiAnalysis.processed;
});

// Virtual for quality score
CommitSchema.virtual('qualityScore').get(function() {
  return this.aiAnalysis.qualityScore;
});

// Methods
CommitSchema.methods.setAIAnalysis = async function(analysis) {
  this.aiAnalysis = {
    processed: true,
    qualityScore: analysis.qualityScore || 0,
    isSpam: analysis.isSpam || false,
    category: analysis.category || 'other',
    summary: analysis.summary || null,
    feedback: analysis.feedback || null,
    suggestions: analysis.suggestions || [],
    technologies: analysis.technologies || [],
    complexity: analysis.complexity || 'medium'
  };
  
  await this.save();
};

CommitSchema.methods.calculateScore = async function() {
  // Base score from commit stats
  const baseScore = Math.min(
    (this.stats.additions + this.stats.deletions) / 10,
    50
  );
  
  // Quality score from AI
  const qualityScore = this.aiAnalysis.qualityScore || 0;
  
  // Timing bonus (early commits get bonus)
  let timingScore = 0;
  if (!this.flags.isLateSubmission) {
    timingScore = 10;
  }
  
  // Penalty for spam
  let spamPenalty = 0;
  if (this.aiAnalysis.isSpam) {
    spamPenalty = 30;
  }
  
  this.score = {
    base: Math.round(baseScore),
    quality: Math.round(qualityScore * 0.5),
    timing: timingScore,
    total: Math.max(0, Math.round(baseScore + (qualityScore * 0.5) + timingScore - spamPenalty))
  };
  
  await this.save();
};

CommitSchema.methods.markAsSpam = async function() {
  this.aiAnalysis.isSpam = true;
  this.isValid = false;
  this.score.total = 0;
  await this.save();
};

// Static methods
CommitSchema.statics.findByEvent = function(eventId) {
  return this.find({ event: eventId, isValid: true })
    .sort({ timestamp: -1 });
};

CommitSchema.statics.findByRepo = function(repoId) {
  return this.find({ repo: repoId, isValid: true })
    .sort({ timestamp: -1 });
};

CommitSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, isValid: true })
    .sort({ timestamp: -1 });
};

CommitSchema.statics.getTopCommits = function(eventId, limit = 10) {
  return this.find({ event: eventId, isValid: true })
    .sort({ 'score.total': -1 })
    .limit(limit)
    .populate('user', 'name githubUsername avatar')
    .populate('repo', 'repoName');
};

CommitSchema.statics.getUnprocessed = function() {
  return this.find({ 'aiAnalysis.processed': false, isValid: true })
    .limit(50);
};

export default mongoose.models.Commit || mongoose.model('Commit', CommitSchema);