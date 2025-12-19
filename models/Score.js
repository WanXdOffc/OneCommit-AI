import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema({
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
  repo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repo',
    required: true
  },
  totalCommits: {
    type: Number,
    default: 0
  },
  validCommits: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  breakdown: {
    baseScore: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      default: 0
    },
    timingScore: {
      type: Number,
      default: 0
    },
    bonusScore: {
      type: Number,
      default: 0
    }
  },
  stats: {
    averageQuality: {
      type: Number,
      default: 0
    },
    totalAdditions: {
      type: Number,
      default: 0
    },
    totalDeletions: {
      type: Number,
      default: 0
    },
    totalFilesChanged: {
      type: Number,
      default: 0
    },
    commitFrequency: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_commit', 'speed_demon', 'quality_master', 'night_owl', 'early_bird', 'consistency_king', 'bug_hunter']
    },
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  rank: {
    type: Number,
    default: null
  },
  percentile: {
    type: Number,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound indexes
ScoreSchema.index({ event: 1, user: 1 }, { unique: true });
ScoreSchema.index({ event: 1, totalScore: -1 });
ScoreSchema.index({ event: 1, rank: 1 });

// Virtual for average score per commit
ScoreSchema.virtual('averageScorePerCommit').get(function() {
  if (this.validCommits === 0) return 0;
  return (this.totalScore / this.validCommits).toFixed(2);
});

// Methods
ScoreSchema.methods.updateFromCommit = async function(commit) {
  this.totalCommits += 1;
  
  if (commit.isValid && !commit.aiAnalysis.isSpam) {
    this.validCommits += 1;
    this.totalScore += commit.score.total || 0;
    
    // Update breakdown
    this.breakdown.baseScore += commit.score.base || 0;
    this.breakdown.qualityScore += commit.score.quality || 0;
    this.breakdown.timingScore += commit.score.timing || 0;
    
    // Update stats
    this.stats.totalAdditions += commit.stats.additions || 0;
    this.stats.totalDeletions += commit.stats.deletions || 0;
    this.stats.totalFilesChanged += commit.stats.filesChanged || 0;
    
    // Calculate average quality
    const Commit = mongoose.model('Commit');
    const commits = await Commit.find({ 
      user: this.user, 
      event: this.event,
      isValid: true 
    });
    
    const totalQuality = commits.reduce((sum, c) => sum + (c.aiAnalysis.qualityScore || 0), 0);
    this.stats.averageQuality = commits.length > 0 ? totalQuality / commits.length : 0;
  }
  
  this.lastUpdated = new Date();
  await this.save();
};

ScoreSchema.methods.addAchievement = async function(achievementType) {
  const exists = this.achievements.some(a => a.type === achievementType);
  if (!exists) {
    this.achievements.push({
      type: achievementType,
      earnedAt: new Date()
    });
    this.breakdown.bonusScore += 50;
    this.totalScore += 50;
    await this.save();
  }
};

ScoreSchema.methods.lockScore = async function() {
  this.isLocked = true;
  await this.save();
};

ScoreSchema.methods.calculateRank = async function() {
  const Score = mongoose.model('Score');
  const higherScores = await Score.countDocuments({
    event: this.event,
    totalScore: { $gt: this.totalScore }
  });
  
  this.rank = higherScores + 1;
  
  const totalParticipants = await Score.countDocuments({ event: this.event });
  this.percentile = totalParticipants > 0 
    ? ((totalParticipants - this.rank) / totalParticipants * 100).toFixed(2)
    : 0;
  
  await this.save();
};

// Static methods
ScoreSchema.statics.findByEvent = function(eventId) {
  return this.find({ event: eventId })
    .populate('user', 'name email githubUsername avatar')
    .populate('repo', 'repoName githubUrl')
    .sort({ totalScore: -1 });
};

ScoreSchema.statics.getLeaderboard = function(eventId, limit = 10) {
  return this.find({ event: eventId })
    .populate('user', 'name githubUsername avatar')
    .populate('repo', 'repoName')
    .sort({ totalScore: -1 })
    .limit(limit);
};

ScoreSchema.statics.getUserScore = function(eventId, userId) {
  return this.findOne({ event: eventId, user: userId })
    .populate('user', 'name githubUsername avatar')
    .populate('repo', 'repoName githubUrl');
};

ScoreSchema.statics.updateAllRanks = async function(eventId) {
  const scores = await this.find({ event: eventId }).sort({ totalScore: -1 });
  
  for (let i = 0; i < scores.length; i++) {
    scores[i].rank = i + 1;
    scores[i].percentile = ((scores.length - i) / scores.length * 100).toFixed(2);
    await scores[i].save();
  }
};

ScoreSchema.statics.getTopScorers = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$user',
        totalScore: { $sum: '$totalScore' },
        totalCommits: { $sum: '$totalCommits' },
        eventsParticipated: { $sum: 1 }
      }
    },
    { $sort: { totalScore: -1 } },
    { $limit: limit }
  ]);
};

export default mongoose.models.Score || mongoose.model('Score', ScoreSchema);