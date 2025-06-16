module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'custom_dining_db',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'mysql',
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'json',
    seederStoragePath: 'sequelizeData.json',
    seederStorageTableName: 'sequelize_data'
  },
  test: {
    username: process.env.TEST_DB_USER || 'root',
    password: process.env.TEST_DB_PASS || '',
    database: process.env.TEST_DB_NAME || 'custom_dining_test',
    host: process.env.TEST_DB_HOST || '127.0.0.1',
    dialect: process.env.TEST_DB_DIALECT || 'mysql'
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASS,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    dialect: process.env.PROD_DB_DIALECT || 'mysql'
  }
};
