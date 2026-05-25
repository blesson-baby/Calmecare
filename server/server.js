const dotenv = require("dotenv");
const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");
const registerSocketServer = require("./socket");

dotenv.config();

connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

registerSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
