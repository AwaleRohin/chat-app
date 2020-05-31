const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const { generateMessage, generateUrl } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersinRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000

const publicDirectory = path.join(__dirname, "../public");

app.use(express.static(publicDirectory));

io.on("connection", (socket) => {
  console.log("New web socket connection");

  socket.on("message-client", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", generateMessage(message, user.username));
    callback("Delivered");
  });

  socket.on("send-location", (coords, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "location-shared",
      generateUrl(
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`,
        user.username
      )
    );
    callback();
  });

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit(
      "message",
      generateMessage(`Welcome! to ${user.room} Chatroom`, "Admin")
    );
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined the chat`, "Admin")
      );
    io.to(user.room).emit("room-user-list", {
      users: getUsersinRoom(user.room),
      roomName: user.room,
    });
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left the chat`, "Admin")
      );
      io.to(user.room).emit("room-user-list", {
        users: getUsersinRoom(user.room),
        roomName: user.room,
      });
    }
  });
});

server.listen(port, () => {
  console.log("App running on port 3000");
});
