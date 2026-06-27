// lightcirle — Auth Middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'lightcirle-admin-secret-2026';

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ title: 'Auth Error', status: 401, detail: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch(e) {
    return res.status(401).json({ title: 'Auth Error', status: 401, detail: 'Invalid or expired token' });
  }
}

module.exports = { authenticate };
