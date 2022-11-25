const app = require("http").createServer(handler);
const io = require("socket.io")(app);
const fs = require("fs");
const url = require("url");
const format = require("./until");
const emoList = require("./emoji"); //导入表情包数据
app.listen(3002, () => {
  console.log("服务器连接成功");
});

// 路由处理
function handler(req, res) {
  let { pathname, query } = url.parse(req.url, true);

  if (pathname == "/login.html") {
    fs.readFile("./login.html", (err, data) => {
      if (!err) {
        res.writeHead(200);
        res.end(data);
      }
    });
  } else if (pathname == "/page.html") {
    if (query.nickName === undefined) {
      res.writeHead(500);
      res.end("Error Not nickName");
    } else {
      fs.readFile("./page.html", (err, data) => {
        if (!err) {
          res.writeHead(200);
          res.end(data);
        }
      });
    }
  }
}

let userList = []; //在线用户列表
let onlineUserNum = 0; //在线人数
let previousRoom; //上个房间
let roomList = ["cy", "209", "一号楼"]; //存在的房间号
io.on("connection", (socket) => {
  // 发送表情包数据
  io.emit("getEmoList", { emoList });
  const roomName = String(socket.handshake.query.roomName); //房间名
  if (roomName !== previousRoom) {
    // 没有数据库 没办法只能先这样处理有大bug    当选择了新的房间 上个房间人将清空
    // 如果不处理 在线人数及列表将显示异常
    // 可自行添加redis数据库存储 解决该问题
    userList = [];
    onlineUserNum = 0;
  }
  previousRoom = roomName;
  // 监听登录用户
  socket.on("loginUser", (data) => {
    const id = socket.id; //生成服务端id
    // 如果存在该房间 则加入房间
    let isExist = roomList.find((item) => item === roomName);
    if (isExist) {
      socket.join(roomName);
      onlineUserNum++;
      // 将用户存储至在线列表
      const user = { id, nickName: data.nickName, clientId: data.clientId };
      userList.push(user);
      // 发送欢迎消息
      io.of("/")
        .to(roomName)
        .emit("hello", {
          msg: `${data.nickName}已经进入该聊天室`,
          onlineUserNum,
          userList,
        });
    } else {
      // 不存在则发送错误消息
      io.emit("error", "该房间不存在");
    }
  });

  // 交换信息事件
  socket.on("exchange", (data) => {
    // 服务端处理时间
    Object.assign(data, { time: format(Date.now()) });
    io.of("/").to(roomName).emit("getMessage", data);
  });

  // 监听断开连接
  socket.on("disconnect", () => {
    let outUser = userList.filter(
      (item) => socket.handshake.query.clientId == item.clientId
    );
    let delIndex = userList.indexOf(outUser[0]);
    userList.splice(delIndex, 1); //删除该元素
    if (onlineUserNum !== 0) {
      onlineUserNum--;
      if (outUser.length !== 0) {
        io.of("/")
          .to(roomName)
          .emit("signOut", {
            msg: `${outUser[0].nickName}已退出该聊天室...`,
            userList: userList,
            onlineUserNum,
          });
      }
      socket.leave(roomName);
    }
  });
});
