const bcrypt = require("bcrypt");

const encrypt = async (data) => {
  try {
    const saltRounds = 10; // Number of salt rounds (cost factor)
    const hash = await bcrypt.hash(data, saltRounds);
    return hash;
  } catch (err) {
    console.error("Error hashing data:", err);
    throw err;
  }
};

const verify = async (data, hash) => {
  try {
    const match = await bcrypt.compare(data, hash);
    return match;
  } catch (err) {
    console.error("Error verifying data:", err);
    throw err;
  }
};

module.exports = { encrypt, verify };
