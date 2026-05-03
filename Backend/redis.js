const redis = require("redis");

const client = redis.createClient({
  socket: {
    host: "localhost", // or 'redis' if using Docker Compose
    port: 6379,
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

(async () => {
  await client.connect();
})();

module.exports = client;
