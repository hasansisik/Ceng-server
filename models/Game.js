const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const GameSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Kullanıcı adı gereklidir"],
      unique: true,
      trim: true,
      minlength: [3, "Kullanıcı adı en az 3 karakter olmalıdır"],
      maxlength: [20, "Kullanıcı adı 20 karakteri geçemez"]
    },
    email: {
      type: String,
      required: [true, "E-posta adresi gereklidir"],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, "Şifre gereklidir"],
      minlength: [6, "Şifre en az 6 karakter olmalıdır"],
      select: false
    },
    verificationCode: {
      type: Number,
      select: false
    },
    passwordToken: {
      type: String,
      select: false
    },
    passwordTokenExpirationDate: {
      type: Date,
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    highScore: {
      type: Number,
      default: 0
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
