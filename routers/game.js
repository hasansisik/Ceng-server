const express = require('express');
const { 
  gameLogin, 
  createGameAccount, 
  getLeaderboard, 
  postScore, 
  getPlayerStats,
  gameLogout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  deleteGame
} = require('../controllers/game');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Oyun API Route'ları
router.post('/login', gameLogin);
router.post('/account', createGameAccount);
router.get('/leaderboard', getLeaderboard);
router.post('/score', isAuthenticated, postScore);
router.get('/player/stats', isAuthenticated, getPlayerStats);
router.get('/logout', isAuthenticated, gameLogout);
router.delete('/account', isAuthenticated, deleteGame);

// E-posta doğrulama ve şifre sıfırlama
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
