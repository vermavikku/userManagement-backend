const sql = require("../libraries/sql");

const insertUserInfo = async (data, connection) => {
  try {
    const result = await sql.insert_transaction("users", data, connection);
    return result;
  } catch (error) {
    console.log(error);
    if (error.message.includes("conflict")) {
      throw new Error(
        `conflict : user_name '${data.user_name}' or email '${data.email}' already exists`
      );
    } else {
      throw new Error(error.message);
    }
  }
};

const getUserByCondition = async (condition, columns = [""]) => {
  try {
    const result = await sql.select("users", columns, condition);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const updateUserInfo = async (data, condition, connection) => {
  try {
    const result = await sql.update_transaction(
      "users",
      data,
      condition,
      connection
    );
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  insertUserInfo,
  getUserByCondition,
  updateUserInfo,
};
