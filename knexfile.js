module.exports = {
  client: 'pg',
  connection: process.env.DATABASE_URL || {
    host: '127.0.0.1',
    user: 'postgres',
    password: null,
    database: 'archive',
  },
};
