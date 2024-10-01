const httpStatus = require("http-status");
const { users, clients } = require("../models");
const { encrypt, verify } = require("../config/crypto");
const pool = require("../config/transaction");

const addClientData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const data = req.body;

    const { client_name, industry, ...userInfo } = data;
    let created_by = 0;
    if (req.hasOwnProperty("userData")) {
      created_by = req.userData.user_id;
    }
    if (Object.keys(data).length == 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ Message: "please provide valid data" });
    }
    const { password } = data;

    const encryptedPass = await encrypt(password);

    await users.insertUserInfo(
      {
        ...userInfo,
        role: "client",
        created_by: created_by,
        password: encryptedPass,
      },
      connection
    );

    await clients.insertClientInfo(
      {
        user_name: userInfo.user_name,
        client_name: client_name,
        industry: industry,
      },
      connection
    );

    await connection.commit();
    return res
      .status(httpStatus.CREATED)
      .json({ Message: "client added successfully" });
  } catch (error) {
    await connection.rollback();
    console.log(error);
    if (error.message.includes("conflict")) {
      return res.status(httpStatus.CONFLICT).json({ Message: error.message });
    }
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

const getAllClients = async (req, res) => {
  try {
    const pagination = req.query;

    const result = await clients.getClientWithPagination(pagination);
    return res.status(httpStatus.OK).send(result);
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

const getAllClientsDropdown = async (req, res) => {
  try {
    const result = await clients.getClientByCondition({});
    return res.status(httpStatus.OK).send(result);
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};
const deleteClientByUsername = async (req, res) => {
  try {
    const username = req.params.username;

    const result = await clients.deleteClient(username);

    if (result > 0) {
      return res.status(httpStatus.OK).json({
        Message: "Client and associated customers deleted successfully",
      });
    }
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ Message: "unable to delete client" });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

const getAllClientByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const result = await clients.getClientWithUser({ "u.user_name": username });
    return res.status(httpStatus.OK).send({ ...result[0] });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

const updateClientByUsername = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const data = req.body;
    const { user_name, client_name, industry } = data;

    let userInfo = {
      email: data.email,
      mobile_number: data.mobile_number,
    };
    if (data.hasOwnProperty("password") && data.password != "") {
      const encryptedPass = await encrypt(data.password);
      userInfo = {
        ...userInfo,
        password: encryptedPass,
      };
    }

    const result = await clients.updateClientInfo(
      { user_name: user_name },
      { client_name: client_name, industry: industry },
      connection
    );
    await users.updateUserInfo(userInfo, { user_name: user_name }, connection);

    if (result > 0) {
      await connection.commit();
      return res
        .status(httpStatus.OK)
        .json({ Message: "Client Info Updated Successfully" });
    } else {
      await connection.rollback();

      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ Message: "unable to update client" });
    }
  } catch (error) {
    await connection.rollback();

    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

module.exports = {
  addClientData,
  getAllClients,
  getAllClientsDropdown,
  deleteClientByUsername,
  getAllClientByUsername,
  updateClientByUsername,
};
