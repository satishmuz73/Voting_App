const jwt = require('jsonwebtoken');

function jwtAuthMiddleware(req, res, next) {
  // Check if the authorization header is present
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: 'Token not found' });
  }
  
  // Extract the JWT token from the authorization header
  const token = authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    // Attach user information to the request object
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

// Function to generate JWT token
const generateToken = (userData) => {
  // Generate a new JWT token using user data
  return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: 300000 });
}

module.exports = { jwtAuthMiddleware, generateToken };
