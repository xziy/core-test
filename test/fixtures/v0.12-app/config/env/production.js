module.exports = {
  models: {
    connection: 'postgres',
    migrate: 'safe'
  },
  adminpanel:{
    auth: true
  },
  log: {
    level: 'info'
  },
  port: process.env.GF_PORT === undefined ? 42777 : process.env.GF_PORT,
  log: {
   level: "silent"
  }

};
