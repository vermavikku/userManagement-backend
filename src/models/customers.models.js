const sql = require("../libraries/sql");
const db = require("../config/database");
const insertCustomerInfo = async (data, connection) => {
  try {
    const result = await sql.insert_transaction("customers", data, connection);
    return result;
  } catch (error) {
    console.log(error);
    if (error.message.includes("conflict")) {
      throw new Error(
        `conflict : user_name '${data.user_name}' AND client_username '${data.client_username}'`
      );
    } else {
      throw new Error(error.message);
    }
  }
};

const getCustomerByCondition = async (condition, columns = [""]) => {
  try {
    const result = await sql.select("customers", columns, condition);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const getCustomersWithPagination = async (pagination, condition = {}) => {
  try {
    const { limit = 10, page = 1, query } = pagination;
    const options = {
      columns: [
        "c.customer_name",
        "c.user_name",
        "c.client_username",
        "cl.client_name",
        "u.email",
        "u.mobile_number",
        "c.creation_time",
      ],
      joins: [
        {
          table: "users u",
          on: "c.user_name = u.user_name",
        },
        {
          table: "clients cl",
          on: "c.client_username = cl.user_name",
        },
      ],
      pagination: {
        limit: limit,
        page: page,
        filter:
          query && query.trim() != ""
            ? { "c.customer_name": query, "u.user_name": query }
            : {},
      },
      order_by: "c.creation_time DESC",
      condition: condition,
    };
    const result = await sql.join_tables_with_pagination(
      "customers c",
      options
    );
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};

const deleteCustomer = async (username) => {
  return new Promise((resolve, reject) => {
    const query = `
  DELETE c, u
  FROM customers c
  JOIN users u ON c.user_name = u.user_name
  WHERE c.user_name = ?`;
    db.query(query, [username], (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.affectedRows);
      }
    });
  });
};

const getCustomerWithUser = async (condition) => {
  try {
    const options = {
      columns: [
        "c.customer_name",
        "c.user_name",
        "c.client_username",
        "u.email",
        "u.mobile_number",
      ],
      joins: [
        {
          table: "users u",
          on: "c.user_name = u.user_name",
        },
      ],

      condition: condition,
    };

    const result = await sql.join_tables("customers c", options);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateCustomerInfo = async (condition, data, connection) => {
  try {
    const result = await sql.update_transaction(
      "customers",
      data,
      condition,
      connection
    );
    return result;
  } catch (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
};

module.exports = {
  insertCustomerInfo,
  getCustomerByCondition,
  getCustomersWithPagination,
  deleteCustomer,
  getCustomerWithUser,
  updateCustomerInfo,
};
