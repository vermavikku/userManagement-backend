const httpStatus = require("http-status");
const { users } = require("../models");
const { encrypt } = require("../config/crypto");

const addUserData = async (req, res) => {
  try {
    const data = req.body;
    let created_by = 0;
    if(req.hasOwnProperty("userData")){
       created_by = req.userData.user_id;
    }
    if (Object.keys(data).length == 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ Message: "please provide valid data" });
    }
    const { password } = data;

    const encryptedPass = await encrypt(password);

    const added = await users.insertUserInfo({
      ...data,
      created_by : created_by,
      password: encryptedPass,
    });

    if (added > 0) {
      return res
        .status(httpStatus.CREATED)
        .json({ Message: "user added successfully" });
    } else {
      return res
        .status(httpStatus.CREATED)
        .json({ Message: "unable to add users" });
    }
  } catch (error) {
    console.log(error);
    if(error.message.includes("conflict")){
        return res.status(httpStatus.CONFLICT).json({ Message: "duplicate entry detected"});
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ Message: "Internal Server Error" });
  }
};

const getUsersList = async (req, res) => {
  try {
    return res.status(httpStatus.OK).json({ Message: "success" });
  } catch (error) {
    console.log(error);
    return res.status(httpStatus).json({ Message: "Internal Server Error" });
  }
};

module.exports = {
  addUserData,
  getUsersList,
};
