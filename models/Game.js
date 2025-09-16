const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const GameSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Score cannot be negative"]
    },
    highScore: {
      type: Number,
      default: 0,
      min: [0, "High score cannot be negative"]
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    lastPlayed: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ["player", "admin"],
      default: "player"
    }
  },
  { timestamps: true }
);

// Password hashing middleware
GameSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password comparison method
GameSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

// Index for leaderboard queries
GameSchema.index({ score: -1 });
GameSchema.index({ highScore: -1 });

const Game = mongoose.model("Game", GameSchema);

module.exports = Game;
