const Game = require("../models/Game");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { generateToken } = require("../services/token.service");
const { sendGameVerificationEmail, sendGameResetPasswordEmail } = require("../helpers");

// Oyun Girişi
const gameLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username, password);

    if (!username || !password) {
      throw new CustomError.BadRequestError("Kullanıcı adı ve şifre gereklidir");
    }

    // Hem email hem username ile giriş yapabilir
    const player = await Game.findOne({
      $or: [
        { username: username },
        { email: username }
      ],
      isActive: true
    }).select("+password");

    console.log("Player found:", !!player);
    if (player) {
      console.log("Player details:", {
        username: player.username,
        email: player.email,
        isVerified: player.isVerified,
        isActive: player.isActive
      });
    }

    if (!player) {
      console.log("Player not found or inactive");
      return res.status(401).json({
        error: "invalid_credentials",
        message: "Kullanıcı adı veya şifre yanlış"
      });
    }

    const isPasswordCorrect = await player.comparePassword(password);
    console.log("Password correct:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log("Password incorrect");
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

    console.log("Login successful for:", player.username);
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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new CustomError.BadRequestError("Kullanıcı adı, e-posta ve şifre gereklidir");
    }

    // Kullanıcı adı zaten var mı kontrol et
    const existingPlayer = await Game.findOne({ username });
    if (existingPlayer) {
      return res.status(409).json({
        error: "username_already_exists",
        message: "Bu kullanıcı adı zaten alınmış"
      });
    }

    // E-posta zaten var mı kontrol et
    const existingEmail = await Game.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        error: "email_already_exists",
        message: "Bu e-posta adresi zaten kayıtlı"
      });
    }

    // Doğrulama kodu oluştur
    const verificationCode = Math.floor(1000 + Math.random() * 9000);

    // Yeni oyuncu oluştur (şifre pre-save middleware ile hash'lenecek)
    const newPlayer = new Game({
      username,
      email,
      password,
      verificationCode,
      score: 0,
      highScore: 0,
      gamesPlayed: 0,
      role: "player",
      isVerified: false
    });

    await newPlayer.save();

    // Doğrulama e-postası gönder (hata olsa bile hesap oluşturuldu)
    try {
      await sendGameVerificationEmail({
        username: newPlayer.username,
        email: newPlayer.email,
        verificationCode: newPlayer.verificationCode,
      });
    } catch (emailError) {
      console.error("E-posta gönderme hatası:", emailError);
      // E-posta gönderilemese bile hesap oluşturuldu, kullanıcıya bilgi ver
    }

    res.status(201).json({
      message: "Hesap başarıyla oluşturuldu. Lütfen e-posta adresinizi doğrulayın.",
      email: newPlayer.email
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

    if (!playerId) {
      return res.status(401).json({
        error: "invalid_token",
        message: "Geçersiz token - playerId bulunamadı"
      });
    }

    if (score === undefined) {
      throw new CustomError.BadRequestError("Skor gereklidir");
    }

    // Sadece tam sayı olmasını kontrol et, negatif olabilir!
    if (typeof score !== 'number' || !Number.isInteger(score)) {
      return res.status(400).json({
        error: "invalid_score",
        message: "Skor bir tam sayı olmalıdır"
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
    player.score += score; // gelen puanı mevcut puana ekle
    if (player.score > player.highScore) {
      player.highScore = player.score;
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

    if (!playerId) {
      return res.status(401).json({
        error: "invalid_token",
        message: "Geçersiz token - playerId bulunamadı"
      });
    }

    
    const player = await Game.findById(playerId)
      .select("username score highScore gamesPlayed lastPlayed createdAt isActive");


    if (!player) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Oyuncu bulunamadı - ID eşleşmiyor"
      });
    }

    if (!player.isActive) {
      return res.status(404).json({
        error: "user_not_found", 
        message: "Oyuncu aktif değil"
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

// E-posta Doğrulama
const verifyEmail = async (req, res, next) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      throw new CustomError.BadRequestError("E-posta ve doğrulama kodu gereklidir");
    }

    const player = await Game.findOne({ email })
      .select("+verificationCode");

    if (!player) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Kullanıcı bulunamadı"
      });
    }

    if (player.verificationCode !== Number(verificationCode)) {
      return res.status(400).json({
        error: "invalid_verification_code",
        message: "Doğrulama kodu yanlış"
      });
    }

    // Hesabı doğrula
    player.isVerified = true;
    player.verificationCode = undefined;
    await player.save();

    res.json({
      message: "Hesap başarıyla doğrulandı"
    });
  } catch (error) {
    console.error("E-posta doğrulama hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Doğrulama E-postası Tekrar Gönder
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError.BadRequestError("E-posta adresi gereklidir");
    }

    const player = await Game.findOne({ email });

    if (!player) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Kullanıcı bulunamadı"
      });
    }

    if (player.isVerified) {
      return res.status(400).json({
        error: "already_verified",
        message: "Hesap zaten doğrulanmış"
      });
    }

    // Yeni doğrulama kodu oluştur
    const verificationCode = Math.floor(1000 + Math.random() * 9000);
    player.verificationCode = verificationCode;
    await player.save();

    // Doğrulama e-postası gönder
    try {
      await sendGameVerificationEmail({
        username: player.username,
        email: player.email,
        verificationCode: player.verificationCode,
      });
    } catch (emailError) {
      console.error("E-posta gönderme hatası:", emailError);
      return res.status(500).json({
        error: "email_send_failed",
        message: "E-posta gönderilemedi, lütfen tekrar deneyin"
      });
    }

    res.json({
      message: "Doğrulama e-postası tekrar gönderildi"
    });
  } catch (error) {
    console.error("Doğrulama e-postası gönderme hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Şifre Sıfırlama E-postası Gönder
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError.BadRequestError("E-posta adresi gereklidir");
    }

    const player = await Game.findOne({ email });

    if (!player) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı"
      });
    }

    // Şifre sıfırlama token'ı oluştur
    const passwordToken = Math.floor(1000 + Math.random() * 9000);

    // Token'ı kaydet (10 dakika geçerli)
    const tenMinutes = 1000 * 60 * 10;
    const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

    player.passwordToken = passwordToken;
    player.passwordTokenExpirationDate = passwordTokenExpirationDate;
    await player.save();

    // Şifre sıfırlama e-postası gönder
    try {
      await sendGameResetPasswordEmail({
        username: player.username,
        email: player.email,
        passwordToken: player.passwordToken,
      });
    } catch (emailError) {
      console.error("E-posta gönderme hatası:", emailError);
      return res.status(500).json({
        error: "email_send_failed",
        message: "E-posta gönderilemedi, lütfen tekrar deneyin"
      });
    }

    res.json({
      message: "Şifre sıfırlama e-postası gönderildi"
    });
  } catch (error) {
    console.error("Şifre sıfırlama e-postası hatası:", error);
    res.status(500).json({
      error: "connection_error",
      message: "Sunucuya ulaşılamıyor"
    });
  }
};

// Şifre Sıfırla
const resetPassword = async (req, res, next) => {
  try {
    const { email, passwordToken, newPassword } = req.body;
    console.log(email, passwordToken, newPassword);

    if (!email || !passwordToken || !newPassword) {
      throw new CustomError.BadRequestError("E-posta, doğrulama kodu ve yeni şifre gereklidir");
    }

    const player = await Game.findOne({ email })
      .select("+passwordToken +passwordTokenExpirationDate");

    if (!player) {
      return res.status(404).json({
        error: "user_not_found",
        message: "Kullanıcı bulunamadı"
      });
    }

    const currentDate = new Date();

    // Token kontrolü
    if (player.passwordToken === String(passwordToken)) {
      if (currentDate > player.passwordTokenExpirationDate) {
        return res.status(400).json({
          error: "token_expired",
          message: "Doğrulama kodu süresi dolmuş"
        });
      }

      // Mevcut isVerified değerini koru
      const currentIsVerified = player.isVerified;

      // Şifreyi güncelle
      player.password = newPassword;
      player.passwordToken = undefined;
      player.passwordTokenExpirationDate = undefined;
      
      // isVerified değerini koru (değiştirme)
      player.isVerified = currentIsVerified;
      
      await player.save();

      res.json({
        message: "Şifre başarıyla sıfırlandı"
      });
    } else {
      res.status(400).json({
        error: "invalid_token",
        message: "Geçersiz doğrulama kodu"
      });
    }
  } catch (error) {
    console.error("Şifre sıfırlama hatası:", error);
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

    if (!playerId) {
      return res.status(401).json({
        error: "invalid_token",
        message: "Geçersiz token - playerId bulunamadı"
      });
    }

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
  gameLogout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
};