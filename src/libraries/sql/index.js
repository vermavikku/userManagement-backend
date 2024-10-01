const mysql2 = require("mysql2");
const db = require("../../config/database");

const insert = (table, data) => {
  return new Promise((resolve, reject) => {
    const columns = Object.keys(data);
    const columns_name = columns.join(", ");
    const values = columns.map((column) => data[column]);
    const placeholders = columns.map(() => "?").join(", ");

    const query = `INSERT INTO ${table} (${columns_name}) VALUES (${placeholders})`;

    db.query(query, values, (error, result) => {
      if (error) {
        if (error.code === "ER_DUP_ENTRY") {
          reject(new Error("conflict"));
        } else {
          reject(error);
        }
      } else {
        resolve(result.affectedRows);
      }
    });
  });
};

const insert_transaction = async (table, data, connection = null) => {
  let insertDb;
  try {
    insertDb = connection || db;

    const columns = Object.keys(data);
    const columns_name = columns.join(", ");
    const values = columns.map((column) => data[column]);
    const placeholders = columns.map(() => "?").join(", ");

    const query = `INSERT INTO ${table} (${columns_name}) VALUES (${placeholders})`;

    const [result] = await insertDb.query(query, values);

    return result.affectedRows;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("conflict");
    }
    throw error;
  }
};

// const update = (table, data, condition) => {
//   return new Promise((resolve, reject) => {
//     const columns = Object.keys(data);
//     const setClause = columns.map((column) => `${column} = ?`).join(", ");
//     const values = columns.map((column) => data[column]);
//     const conditionColumns = Object.keys(condition);
//     const conditionClause = conditionColumns
//       .map((column) => `${column} = ?`)
//       .join(" AND ");
//     const conditionValues = conditionColumns.map((column) => condition[column]);

//     const query = `UPDATE ${table} SET ${setClause} WHERE ${conditionClause}`;

//     db.query(query, [...values, ...conditionValues], (error, result) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(result.affectedRows);
//       }
//     });
//   });
// };

const update = (table, data, condition) => {
  return new Promise((resolve, reject) => {
    const columns = Object.keys(data);
    const setClause = columns.map((column) => `${column} = ?`).join(", ");
    const values = columns.map((column) => data[column]);

    // Prepare condition clause and values
    let conditionClause = [];
    let conditionValues = [];
    Object.keys(condition).forEach((column) => {
      if (condition[column] === null) {
        conditionClause.push(`${column} IS NULL`);
      } else if (condition[column] === "NOT NULL") {
        conditionClause.push(`${column} IS NOT NULL`);
      } else {
        conditionClause.push(`${column} = ?`);
        conditionValues.push(condition[column]);
      }
    });

    conditionClause = conditionClause.join(" AND ");

    const query = `UPDATE ${table} SET ${setClause} WHERE ${conditionClause}`;

    // Show the query with values substituted
    // const allValues = [...values, ...conditionValues];
    // const actualQuery = query.replace(/\?/g, () => `'${allValues.shift()}'`);
    // console.log("Actual Query:", actualQuery);

    db.query(query, values.concat(conditionValues), (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.affectedRows);
      }
    });
  });
};

const update_transaction = async (
  table,
  data,
  condition,
  connection = null
) => {
  const updateDb = connection;
  try {
    const columns = Object.keys(data);
    const setClause = columns.map((column) => `${column} = ?`).join(", ");
    const values = columns.map((column) => data[column]);
    const conditionColumns = Object.keys(condition);
    const conditionClause = conditionColumns
      .map((column) => `${column} = ?`)
      .join(" AND ");
    const conditionValues = conditionColumns.map((column) => condition[column]);

    const query = `UPDATE ${table} SET ${setClause} WHERE ${conditionClause}`;

    const [result] = await updateDb.query(query, [
      ...values,
      ...conditionValues,
    ]);
    return result.affectedRows;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("conflict");
    }
    throw error;
  }
};

const delete_transaction = async (table, condition, connection = null) => {
  const deleteDb = connection;
  try {
    // Build the condition clause for the DELETE query
    const conditionColumns = Object.keys(condition);
    const conditionClause = conditionColumns
      .map((column) => `${column} = ?`)
      .join(" AND ");
    const conditionValues = conditionColumns.map((column) => condition[column]);

    // Construct the DELETE query
    const query = `DELETE FROM ${table} WHERE ${conditionClause}`;

    // Execute the DELETE query using the connection
    const [result] = await deleteDb.query(query, conditionValues);
    return result.affectedRows;
  } catch (error) {
    // Specific error handling for foreign key constraint violations
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      throw new Error("IN_USE");
    }
    throw error;
  }
};

const deleteRecord = (table, condition) => {
  return new Promise((resolve, reject) => {
    const conditionColumns = Object.keys(condition);
    const conditionClause = conditionColumns
      .map((column) => `${column} = ?`)
      .join(" AND ");
    const conditionValues = conditionColumns.map((column) => condition[column]);

    const query = `DELETE FROM ${table} WHERE ${conditionClause}`;

    db.query(query, conditionValues, (error, result) => {
      if (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
          reject(new Error("IN_USE"));
        } else {
          reject(error);
        }
      } else {
        resolve(result.affectedRows);
      }
    });
  });
};

// const select = (table, columns = ["*"], condition = {}, options = {}) => {
//   return new Promise((resolve, reject) => {
//     let columnsClause = "*";
//     if (columns && columns.length > 0 && columns[0] !== "") {
//       columnsClause = columns.join(", ");
//     }

//     const conditionKeys = Object.keys(condition);
//     let conditionClause = "";
//     let conditionValues = [];

//     if (conditionKeys.length > 0) {
//       conditionClause = conditionKeys
//         .map((key) => {
//           const value = condition[key];

//           // Check if value is an array for IN clause
//           if (Array.isArray(value)) {
//             // Use IN clause
//             return `${key} IN (${value.map(() => "?").join(", ")})`;
//           }

//           // Check if the key contains an operator like '!='
//           const operatorMatch = key.match(/(.+)([!<>=]{1,2})$/);
//           if (operatorMatch) {
//             const column = operatorMatch[1].trim();
//             const operator = operatorMatch[2].trim();
//             return `${column}${operator} ?`; // Remove spaces between column and operator
//           } else {
//             return `${key} = ?`;
//           }
//         })
//         .join(" AND ");

//       conditionValues = conditionKeys.flatMap((key) => {
//         const value = condition[key];
//         // If value is an array, spread it into condition values
//         return Array.isArray(value) ? value : [value];
//       });
//     }

//     let query = `SELECT ${columnsClause} FROM ${table}`;
//     if (conditionClause !== "") {
//       query += ` WHERE ${conditionClause}`;
//     }

//     if (options.group_by) {
//       query += ` GROUP BY ${options.group_by}`;
//     }

//     if (options.order_by) {
//       query += ` ORDER BY ${options.order_by}`;
//     }

//     db.query(query, conditionValues, (error, results) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(results);
//       }
//     });
//   });
// };

const select = (table, columns = ["*"], condition = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    let columnsClause = "*";
    if (columns && columns.length > 0 && columns[0] !== "") {
      columnsClause = columns.join(", ");
    }

    const conditionKeys = Object.keys(condition);
    let conditionClause = "";
    let conditionValues = [];

    if (conditionKeys.length > 0) {
      conditionClause = conditionKeys
        .map((key) => {
          const value = condition[key];

          // Check if value is an array for IN or NOT IN clause
          if (Array.isArray(value)) {
            if (key.includes(" NOT IN")) {
              return `${key.replace(" NOT IN", "")} NOT IN (${value
                .map(() => "?")
                .join(", ")})`;
            }
            // Use IN clause
            return `${key} IN (${value.map(() => "?").join(", ")})`;
          }

          // Check if the key contains an operator like '!='
          const operatorMatch = key.match(/(.+)([!<>=]{1,2})$/);
          if (operatorMatch) {
            const column = operatorMatch[1].trim();
            const operator = operatorMatch[2].trim();
            return `${column}${operator} ?`; // Remove spaces between column and operator
          } else {
            return `${key} = ?`;
          }
        })
        .join(" AND ");

      conditionValues = conditionKeys.flatMap((key) => {
        const value = condition[key];
        // If value is an array, spread it into condition values
        return Array.isArray(value) ? value : [value];
      });
    }

    let query = `SELECT ${columnsClause} FROM ${table}`;
    if (conditionClause !== "") {
      query += ` WHERE ${conditionClause}`;
    }

    if (options.group_by) {
      query += ` GROUP BY ${options.group_by}`;
    }

    if (options.order_by) {
      query += ` ORDER BY ${options.order_by}`;
    }

    db.query(query, conditionValues, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

const select_with_pagination = (
  table,
  {
    limit = 10,
    page = 1,
    filter = {},
    condition = "",
    order = "",
    columns = ["*"],
  } = {}
) => {
  return new Promise((resolve, reject) => {
    // Ensure limit and page are integers
    limit = parseInt(limit, 10);
    page = parseInt(page, 10);

    // Ensure columns is an array and not empty
    if (!Array.isArray(columns) || columns.length === 0) {
      columns = ["*"];
    }
    const columnsString = columns.join(", ");

    // Build the filter clause and values from the filter object
    const filterColumns = Object.keys(filter);
    let filterClause = "";
    let filterValues = [];

    if (filterColumns.length > 0) {
      filterClause = filterColumns
        .map((column) => `${column} LIKE ?`)
        .join(" OR ");
      filterValues = filterColumns.map((column) => `%${filter[column]}%`);
    }

    // Combine filter clause with condition if both are provided
    let whereClause = condition;
    if (filterClause !== "" && condition !== "") {
      whereClause = `(${condition}) AND (${filterClause})`;
    } else if (filterClause !== "") {
      whereClause = filterClause;
    } else if (condition !== "") {
      whereClause = condition;
    }

    // Query to get the total number of rows
    let countQuery = `SELECT COUNT(*) AS total FROM ${table}`;
    if (whereClause !== "") {
      countQuery += ` WHERE ${whereClause}`;
    }

    db.query(countQuery, filterValues, (error, countResults) => {
      if (error) {
        reject(error);
        return;
      }

      const totalRows = countResults[0].total;
      const totalPages = Math.ceil(totalRows / limit);
      const offset = (page - 1) * limit;

      // Query to get the paginated results
      let query = `SELECT ${columnsString} FROM ${table}`;
      if (whereClause !== "") {
        query += ` WHERE ${whereClause}`;
      }
      if (order !== "") {
        query += ` ORDER BY ${order}`;
      }
      query += ` LIMIT ? OFFSET ?`;

      db.query(query, [...filterValues, limit, offset], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            totalResults: totalRows,
            totalPages: totalPages,
            limit: limit,
            currentPage: page,
            results: results,
          });
        }
      });
    });
  });
};

const join_tables = (table, options = {}) => {
  return new Promise((resolve, reject) => {
    const { columns = ["*"], joins = [], condition = {}, order = "" } = options;

    let columnsClause = "*";
    if (columns && columns.length > 0 && columns[0] !== "") {
      columnsClause = columns.join(", ");
    }

    // Handle joins
    let joinClause = "";
    if (joins && joins.length > 0) {
      joinClause = joins
        .map((join) => {
          return `${join.type || "INNER"} JOIN ${join.table} ON ${join.on}`;
        })
        .join(" ");
    }

    // Handle conditions
    const conditionColumns = Object.keys(condition);
    let conditionClause = "";
    let conditionValues = [];

    if (conditionColumns.length > 0) {
      conditionClause = conditionColumns
        .map((column) => `${column} = ?`)
        .join(" AND ");
      conditionValues = conditionColumns.map((column) => condition[column]);
    }

    // Construct query
    let query = `SELECT ${columnsClause} FROM ${table} ${joinClause}`;
    if (conditionClause !== "") {
      query += ` WHERE ${conditionClause}`;
    }
    if (order !== "") {
      query += ` ORDER BY ${order}`;
    }

    db.query(query, conditionValues, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

// const join_tables_with_pagination = (table, options = {}) => {
//   return new Promise((resolve, reject) => {
//     const {
//       columns = ["*"],
//       joins = [],
//       condition = {},
//       order = "",
//       pagination = { limit: 10, page: 1, filter: {} },
//     } = options;

//     let { limit, page, filter } = pagination;

//     limit = parseInt(limit, 10);
//     page = parseInt(page, 10);

//     let columnsClause = "*";
//     if (columns && columns.length > 0 && columns[0] !== "") {
//       columnsClause = columns.join(", ");
//     }

//     // Handle joins
//     let joinClause = "";
//     if (joins && joins.length > 0) {
//       joinClause = joins
//         .map((join) => {
//           return `${join.type || "INNER"} JOIN ${join.table} ON ${join.on}`;
//         })
//         .join(" ");
//     }

//     // Handle conditions
//     const conditionEntries = Object.entries(condition);
//     let conditionClause = "";
//     let conditionValues = [];

//     if (conditionEntries.length > 0) {
//       conditionClause = conditionEntries
//         .map(([key, value]) => {
//           let [column, operator] = key.split(" ");
//           operator = operator || "="; // Default to "=" if no operator provided
//           return `${column} ${operator} ?`;
//         })
//         .join(" AND ");
//       conditionValues = conditionEntries.map(([key, value]) => value);
//     }

//     // Handle filters with OR condition
//     const filterColumns = Object.keys(filter);
//     let filterClause = "";
//     if (filterColumns.length > 0) {
//       filterClause = filterColumns
//         .map((column) => `${column} LIKE ?`)
//         .join(" OR ");
//       conditionClause += conditionClause
//         ? ` AND (${filterClause})`
//         : `(${filterClause})`;
//       conditionValues.push(
//         ...filterColumns.map((column) => `%${filter[column]}%`)
//       );
//     }

//     // Construct query
//     let query = `SELECT ${columnsClause} FROM ${table} ${joinClause}`;
//     if (conditionClause !== "") {
//       query += ` WHERE ${conditionClause}`;
//     }
//     if (order !== "") {
//       query += ` ORDER BY ${order}`;
//     }
//     query += ` LIMIT ? OFFSET ?`;
//     conditionValues.push(limit, (page - 1) * limit);

//     db.query(query, conditionValues, (error, results) => {
//       if (error) {
//         reject(error);
//       } else {
//         // Get total count
//         let countQuery = `SELECT COUNT(*) as totalCount FROM ${table} ${joinClause}`;
//         if (conditionClause !== "") {
//           countQuery += ` WHERE ${conditionClause}`;
//         }

//         db.query(
//           countQuery,
//           conditionValues.slice(0, -2),
//           (countError, countResults) => {
//             if (countError) {
//               reject(countError);
//             } else {
//               const totalResults = countResults[0].totalCount;
//               const totalPages = Math.ceil(totalResults / limit);
//               resolve({
//                 totalPages,
//                 currentPage: page,
//                 limit: limit,
//                 totalResults,
//                 results,
//               });
//             }
//           }
//         );
//       }
//     });
//   });
// };

const join_tables_with_pagination = (table, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      columns = ["*"],
      joins = [],
      condition = {},
      order = "",
      group_by = "", // Added group_by parameter
      pagination = { limit: 10, page: 1, filter: {} },
    } = options;

    let { limit, page, filter } = pagination;

    limit = parseInt(limit, 10);
    page = parseInt(page, 10);

    let columnsClause = "*";
    if (columns && columns.length > 0 && columns[0] !== "") {
      columnsClause = columns.join(", ");
    }

    // Handle joins
    let joinClause = "";
    if (joins && joins.length > 0) {
      joinClause = joins
        .map((join) => {
          return `${join.type || "INNER"} JOIN ${join.table} ON ${join.on}`;
        })
        .join(" ");
    }

    // Handle conditions
    const conditionEntries = Object.entries(condition);
    let conditionClause = "";
    let conditionValues = [];

    if (conditionEntries.length > 0) {
      conditionClause = conditionEntries
        .map(([key, value]) => {
          let [column, operator] = key.split(" ");
          operator = operator || "="; // Default to "=" if no operator provided
          if (operator.toUpperCase() === "IN") {
            // Join array elements with quotes and commas for SQL `IN` clause
            return `${column} IN (${value.map(() => "?").join(", ")})`;
          }
          return `${column} ${operator} ?`;
        })
        .join(" AND ");

      // Flatten conditionValues to handle the array case for "IN"
      conditionValues = conditionEntries.reduce((values, [key, value]) => {
        let [, operator] = key.split(" ");
        if (operator && operator.toUpperCase() === "IN") {
          return values.concat(value); // Add all IN clause values
        }
        return values.concat(value); // Add normal condition value
      }, []);
    }

    // Handle filters with OR condition
    const filterColumns = Object.keys(filter);
    let filterClause = "";
    if (filterColumns.length > 0) {
      filterClause = filterColumns
        .map((column) => `${column} LIKE ?`)
        .join(" OR ");
      conditionClause += conditionClause
        ? ` AND (${filterClause})`
        : `(${filterClause})`;
      conditionValues.push(
        ...filterColumns.map((column) => `%${filter[column]}%`)
      );
    }

    // Construct main query
    let query = `SELECT ${columnsClause} FROM ${table} ${joinClause}`;

    if (conditionClause !== "") {
      query += ` WHERE ${conditionClause}`;
    }

    // Add GROUP BY clause if provided
    if (group_by) {
      query += ` GROUP BY ${group_by}`;
    }

    if (order !== "") {
      query += ` ORDER BY ${order}`;
    }
    query += ` LIMIT ? OFFSET ?`;
    conditionValues.push(limit, (page - 1) * limit);

    // Log the final query with values
    // const logQuery = (query, values) => {
    //   const formattedQuery = mysql2.format(query, values);
    //   console.log("Final Query:", formattedQuery);
    // };

    // Execute main query
    db.query(query, conditionValues, (error, results) => {
      if (error) {
        reject(error);
      } else {
        // Adjust the count query based on whether group_by is provided
        let countQuery = `SELECT COUNT(${
          group_by ? `DISTINCT ${group_by}` : "*"
        }) as totalCount FROM ${table} ${joinClause}`;

        if (conditionClause !== "") {
          countQuery += ` WHERE ${conditionClause}`;
        }

        db.query(
          countQuery,
          conditionValues.slice(0, -2), // Exclude limit and offset for the count query
          (countError, countResults) => {
            if (countError) {
              reject(countError);
            } else {
              const totalResults = countResults[0].totalCount;
              const totalPages = Math.ceil(totalResults / limit);
              resolve({
                totalPages,
                currentPage: page,
                limit: limit,
                totalResults,
                results,
              });
            }
          }
        );
      }
    });
  });
};

module.exports = {
  insert,
  insert_transaction,
  update_transaction,
  delete_transaction,
  update,
  delete: deleteRecord,
  select,
  select_with_pagination,
  join_tables,
  join_tables_with_pagination,
};
