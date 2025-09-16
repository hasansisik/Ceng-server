const Game = require("../models/Game");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { generateToken } = require("../services/token.service");

// Oyun Girişi
const gameLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new CustomError.BadRequestError("Kullanıcı adı ve şifre gereklidir");
    }

    const player = await Game.findOne({ username, isActive: true })
      .select("+password");

    if (!player) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Kullanıcı adı veya şifre yanlış"
      });
    }

    const isPasswordCorrect = await player.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Kullanıcı adı veya şifre yanlış"
      });
    }

    // Token oluştur
    const accessToken = await generateToken(
      { playerId: player._id, username: player.username, role: player.role },
      "365d",
      process.env.ACCESS_TOKEN_SECRET
    );
    const refreshToken = await generateToken(
      { playerId: player._id, username: player.username, role: player.role },
      "365d",
      process.env.REFRESH_TOKEN_SECRET
    );

    // Refresh token cookie'sini ayarla
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/v1/game/refreshtoken",
      maxAge: 365 * 24 * 60 * 60 * 1000, //365 gün
    });

    // Token'ı veritabanına kaydet
    const token = new Token({
      refreshToken,
      accessToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      user: player._id,
    });

    await token.save();

    // Son oynama zamanını güncelle
    player.lastPlayed = new Date();
    await player.save();

    res.status(200).json({
      dataPlayer: {
        username: player.username,
        score: player.score,
        token: accessToken
      }
    });
  } catch (error) {
    console.error("Oyun giriş hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Oyun Hesabı Oluştur
const createGameAccount = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new CustomError.BadRequestError("Kullanıcı adı ve şifre gereklidir");
    }

    // Kullanıcı adı zaten var mı kontrol et
    const existingPlayer = await Game.findOne({ username });
    if (existingPlayer) {
      return res.status(409).json({
        error: "username_already_exists",
        message: "Bu kullanıcı adı zaten alınmış"
      });
    }

    // Yeni oyuncu oluştur (şifre pre-save middleware ile hash'lenecek)
    const newPlayer = new Game({
      username,
      password,
      score: 0,
      highScore: 0,
      gamesPlayed: 0,
      role: "player"
    });

    await newPlayer.save();

    res.status(201).json({
      message: "Hesap başarıyla oluşturuldu"
    });
  } catch (error) {
    console.error("Hesap oluşturma hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya bağlanılamadı"
    });
  }
};

// Liderlik Tablosu
const getLeaderboard = async (req, res, next) => {
  try {
    const players = await Game.find({ isActive: true })
      .select("username score")
      .sort({ score: -1 })
      .limit(100); // İlk 100 oyuncu

    const leaderboard = players.map(player => ({
      username: player.username,
      score: player.score
    }));

    res.status(200).json({
      leaderboard
    });
  } catch (error) {
    console.error("Liderlik tablosu hatası:", error);
    res.status(503).json({
      error: "leaderboard_unavailable",
      message: "Liderlik tablosu hizmeti kullanılamıyor"
    });
  }
};

// Skor Gönder (Oyun Bitti) - Kimlik Doğrulama Gerekli
const postScore = async (req, res, next) => {
  try {
    const { score } = req.body;
    const playerId = req.user.playerId;

    if (score === undefined) {
      throw new CustomError.BadRequestError("Skor gereklidir");
    }

    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
      return res.status(400).json({
        error: "invalid_score",
        message: "Skor pozitif bir tam sayı olmalıdır"
      });
    }

    const player = await Game.findById(playerId);

    if (!player || !player.isActive) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Oyuncu bulunamadı"
      });
    }

    // Oyuncu verilerini güncelle
    player.score = score;
    if (score > player.highScore) {
      player.highScore = score;
    }
    player.gamesPlayed += 1;
    player.lastPlayed = new Date();

    await player.save();

    res.status(200).json({
      message: "Skor başarıyla güncellendi",
      dataPlayer: {
        username: player.username,
        score: player.score
      }
    });
  } catch (error) {
    console.error("Skor gönderme hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Oyuncu İstatistikleri - Kimlik Doğrulama Gerekli
const getPlayerStats = async (req, res, next) => {
  try {
    const playerId = req.user.playerId;

    const player = await Game.findById(playerId)
      .select("username score highScore gamesPlayed lastPlayed createdAt");

    if (!player || !player.isActive) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Oyuncu bulunamadı"
      });
    }

    res.status(200).json({
      dataPlayer: {
        username: player.username,
        score: player.score,
        highScore: player.highScore,
        gamesPlayed: player.gamesPlayed,
        lastPlayed: player.lastPlayed,
        memberSince: player.createdAt
      }
    });
  } catch (error) {
    console.error("Oyuncu istatistikleri hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Oyun Çıkışı
const gameLogout = async (req, res, next) => {
  try {
    const playerId = req.user.playerId;

    // Token'ı veritabanından sil
    await Token.findOneAndDelete({ user: playerId });

    // Refresh token cookie'sini temizle
    res.clearCookie("refreshToken", { path: "/v1/game/refreshtoken" });

    res.json({
      message: "Başarıyla çıkış yapıldı"
    });
  } catch (error) {
    console.error("Oyun çıkış hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

module.exports = {
  gameLogin,
  createGameAccount,
  getLeaderboard,
  postScore,
  getPlayerStats,
  gameLogout
};