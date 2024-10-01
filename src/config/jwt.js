const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET_KEY;

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          reject(new Error("Token has expired"));
        } else {
          reject(new Error("Invalid token"));
        }
      } else {
        resolve(decoded);
      }
    });
  });
};

function generateToken(payload) {
  // Generate JWT token with payload and secret
  return jwt.sign(payload, secret, { expiresIn: "12h" }); // Token expires in 1 hour
}

module.exports = {
  generateToken,
  verifyToken,
};
