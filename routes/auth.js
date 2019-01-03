const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRY } = require('../config');
const router = express.Router();
const localAuth = require('../authentication/local');
const jwtAuth = require('../authentication/jwt');

router.use(express.json());

function createAuthToken (user){
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
}

router.post('/login', localAuth, (req, res) => {
  const user = req.user;
  const authToken = createAuthToken(user);
  res.json({ authToken });
});

router.post('/refresh', jwtAuth, (req, res) => {
  const user = req.user;
  const authToken = createAuthToken(user);
  res.json({ authToken});
});

module.exports = router;