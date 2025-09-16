const express = require('express');
const { 
  gameLogin, 
  createGameAccount, 
  getLeaderboard, 
  postScore, 
  getPlayerStats,
  gameLogout
} = require('../controllers/game');
const { isAuthenticated } = require('../middleware/authMiddleware');

const router = express.Router();

// Game API Routes
router.post('/login', gameLogin);
router.post('/account', createGameAccount);
router.get('/leaderboard', getLeaderboard);
router.post('/score', isAuthenticated, postScore);
router.get('/player/stats', isAuthenticated, getPlayerStats);
router.get('/logout', isAuthenticated, gameLogout);

module.exports = router;
