const session = require("express-session");
const RedisStore = require("connect-redis")(session);
require("dotenv").config();

module.exports = new RedisStore({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`
});
