const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
    // Add analytics fields
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // For tracking daily stats
    dailyStats: [{
      date: Date,
      views: Number,
      likes: Number,
    }],
  },
  { timestamps: true }
);
module.exports = mongoose.model('Article', articleSchema);