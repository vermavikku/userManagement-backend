const httpStatus = require("http-status");
const { users, clients, customers } = require("../models");
const { encrypt } = require("../config/crypto");
const pool = require("../config/transaction");

const addCustomerData = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const data = req.body;

    const { customer_name, client_username, ...userInfo } = data;
    let created_by = 0;
    if (req.hasOwnProperty("userData")) {
      created_by = req.userData.user_id;
    }
    if (Object.keys(data).length == 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ Message: "please provide valid data" });
    }

    const checkClient = await clients.getClientByCondition({
      user_name: client_username,
    });

    if (checkClient.length == 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        Message: `client with username '${client_username}' not exists`,
      });
    }

    const { password } = data;

    const encryptedPass = await encrypt(password);

    await users.insertUserInfo(
      {
        ...userInfo,
        role: "user",
        created_by: created_by,
        password: encryptedPass,
      },
      connection
    );

    await customers.insertCustomerInfo(
      {
        user_name: userInfo.user_name,
        customer_name: customer_name,
        client_username: client_username,
      },
      connection
    );

    await connection.commit();
    return res
      .status(httpStatus.CREATED)
      .json({ Message: "customer added successfully" });
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

const getAllCustomers = async (req, res) => {
  try {
    const pagination = req.query;
    const roleCode = req.role_code;

    let condition = {};

    if (roleCode == "client") {
      condition = { "c.client_username": req.userData.username };
    }
    const result = await customers.getCustomersWithPagination(
      pagination,
      condition
    );
    return res.status(httpStatus.OK).send(result);
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};
const deleteCustomerByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const result = await customers.deleteCustomer(username);
    if (result > 0) {
      return res
        .status(httpStatus.OK)
        .json({ Message: "customer deleted successfully" });
    }
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ Message: "unable to delete customer" });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

const getAllCustomersByUsername = async (req, res) => {
  try {
    const username = req.params.username;
    const result = await customers.getCustomerWithUser({
      "u.user_name": username,
    });
    return res.status(httpStatus.OK).send({ ...result[0] });
  } catch (error) {
    console.log(error);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ Message: "Internal Server Error" });
  }
};

const updateCustomersByUsername = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const data = req.body;
    const { user_name, customer_name, client_username } = data;
    
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

    const result = await customers.updateCustomerInfo(
      { user_name: user_name },
      { customer_name: customer_name, client_username: client_username },
      connection
    );
    await users.updateUserInfo(userInfo, { user_name: user_name }, connection);
    if (result > 0) {
      await connection.commit();
      return res
        .status(httpStatus.OK)
        .json({ Message: "Customer Info Updated Successfully" });
    } else {
      await connection.rollback();
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ Message: "unable to update Customer" });
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
  addCustomerData,
  getAllCustomers,
  deleteCustomerByUsername,
  updateCustomersByUsername,
  getAllCustomersByUsername,
};
