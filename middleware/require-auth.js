function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please log in." });
  }
  next();
}

module.exports = requireAuth;