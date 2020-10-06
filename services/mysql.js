const mysql = require("mysql-promise")();
mysql.configure({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "test",
});
module.exports = mysql;
