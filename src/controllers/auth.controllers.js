const httpStatus = require("http-status");
const { users } = require("../models");
const { verify } = require("../config/crypto");
const { generateToken } = require("../config/jwt");

const logInUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const checkUsername = await users.getUserByCondition({
      user_name: username,
    });

    if (checkUsername.length == 0) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ Message: `invalid username or password ` });
    }

    const user = checkUsername[0];

    const verifyPassword = await verify(password,user.password);

    if(!verifyPassword){
        return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ Message: `invalid username or password` });
    }

    const tokenPayload = {
        user_id  :user.user_id,
        username : user.user_name,
    }

    const token = await generateToken(tokenPayload);

    return res.status(httpStatus.OK).json({token : token,username : user.user_name,role:user.role});

  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

module.exports = {
    logInUser
}
