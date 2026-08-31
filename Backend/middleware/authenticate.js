// middleware/authenticate.js
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'supersecretkey';

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token required' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token malformed' });
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // { username, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticate };
