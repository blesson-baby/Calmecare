const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("./models/userModel");
const Session = require("./models/sessionModel");

const getSessionForUser = async (sessionId, userId) => {
  return Session.findOne({
    _id: sessionId,
    $or: [{ patient: userId }, { psychologist: userId }]
  }).populate("patient psychologist", "name email role");
};

const registerSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-session", async ({ sessionId }, callback = () => {}) => {
      try {
        const session = await getSessionForUser(sessionId, socket.user._id);

        if (!session) {
          callback({ ok: false, message: "Session access denied" });
          return;
        }

        socket.join(sessionId);

        if (socket.user.role === "patient" && session.callStatus === "waiting") {
          session.callStatus = "live";
          await session.save();
        }

        io.to(sessionId).emit("call-state", {
          sessionId,
          callStatus: session.callStatus,
          patientJoined: socket.user.role === "patient"
        });

        socket.to(sessionId).emit("user-joined", {
          userId: socket.user._id.toString(),
          role: socket.user.role,
          name: socket.user.name
        });

        callback({
          ok: true,
          shouldCreateOffer:
            ["psychologist", "clinicalpsychologist"].includes(socket.user.role) &&
            session.callStatus === "live"
        });
      } catch (error) {
        callback({ ok: false, message: error.message });
      }
    });

    socket.on("offer", ({ sessionId, offer }) => {
      socket.to(sessionId).emit("offer", {
        offer,
        from: socket.user._id.toString()
      });
    });

    socket.on("answer", ({ sessionId, answer }) => {
      socket.to(sessionId).emit("answer", {
        answer,
        from: socket.user._id.toString()
      });
    });

    socket.on("ice-candidate", ({ sessionId, candidate }) => {
      socket.to(sessionId).emit("ice-candidate", {
        candidate,
        from: socket.user._id.toString()
      });
    });

    socket.on("leave-session", ({ sessionId }) => {
      socket.leave(sessionId);
      socket.to(sessionId).emit("peer-left", {
        userId: socket.user._id.toString()
      });
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.to(roomId).emit("peer-left", {
            userId: socket.user?._id?.toString()
          });
        }
      });
    });
  });

  return io;
};

module.exports = registerSocketServer;
