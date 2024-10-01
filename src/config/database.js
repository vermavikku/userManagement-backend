const mysql = require("mysql2");
const { encrypt } = require("./crypto");
require("dotenv").config();

// Create a pool without specifying the database initially
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to initialize the database and tables
const initializeDatabase = async () => {
  const connection = await pool.promise().getConnection();

  try {
    console.log("Connected to MySQL without specifying database");

    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log("Database created or already exists: " + process.env.DB_NAME);

    // Reconnect using the new database
    await connection.changeUser({ database: process.env.DB_NAME });
    console.log("Switched to the database");

    const createTableQueries = [
      `
      CREATE TABLE IF NOT EXISTS users (
        user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        mobile_number VARCHAR(25) NOT NULL,
        role ENUM('admin', 'user', 'client') NOT NULL DEFAULT 'user',
        created_by BIGINT DEFAULT 0 NOT NULL,
        updated_by BIGINT NULL,
        creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
      `,
      `
      CREATE TABLE IF NOT EXISTS clients (
        c_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(150) NOT NULL UNIQUE,
        client_name VARCHAR(150) NOT NULL,
        industry VARCHAR(150) NOT NULL,
        created_by BIGINT DEFAULT 0 NOT NULL,
        updated_by BIGINT NULL,
        creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
      `,
      `
      CREATE TABLE IF NOT EXISTS customers (
        cust_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(150) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        client_username VARCHAR(150) NOT NULL,
        UNIQUE(user_name, client_username),
        created_by BIGINT DEFAULT 0 NOT NULL,
        updated_by BIGINT NULL,
        creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updation_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
      `,
    ];

    for (const query of createTableQueries) {
      await connection.query(query);
      console.log("Table created or already exists");
    }

    // Encrypt the default password
    const password = await encrypt("root@123");

    const defaultUserQuery = `
      INSERT INTO users (user_name, password, email, mobile_number, role) 
      VALUES ('root', '${password}', 'admin@123', '8888888888', 'admin') 
      ON DUPLICATE KEY UPDATE
          password = VALUES(password),
          role = VALUES(role);
    `;

    await connection.query(defaultUserQuery);
    console.log("Default user inserted or updated");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    connection.release();
    console.log("Connection released");
  }
};

// Initialize the database
initializeDatabase();

module.exports = pool;
