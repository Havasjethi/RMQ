// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const path = require("path");
const amqplib = require("amqplib");

// const username = "rabbitmq";
const username = "guest";

// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
const connection_config = {
  hostname: "localhost",
  username,
  password: username,
  vhost: "/",
};

class ConnHolder {
  /** @type {amqplib.Connection} */
  connection;
  /** @type {amqplib.Channel[]} */
  channels = [];
  /** @type {amqplib.Channel[]} */
  all_channels = [];

  /** @param connection {amqplib.Connection} */
  constructor(connection) {
    this.connection = connection;
  }

  /** @returns {Promise<amqplib.Channel>} */
  async _getChannel() {
    const channel = this.connection.createChannel();
    this.all_channels.push(channel);
    return await channel;
  }

  async consume(queue_name, string_handler) {
    const channel = await this._getChannel();
    const x = channel.assertQueue(queue_name, {});
    channel.consume(queue_name, (message) => {
      string_handler(message);
      channel.ack(message);
    });
  }

  close() {
    try {
      this.connection.close();
    } catch (e) {
      console.log("Unable to close connection");
    }
  }
}

const main = async () => {
  const c = new ConnHolder(await amqplib.connect(connection_config));

  c.consume("Qeue", (message) => {
    console.log(String.fromCharCode(...message.content));

    setTimeout(() => {
      console.log("Closing connection");
      c.close();
    }, 2_000);
  });

  // console.log(channel);
};
main();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}
function init() {
  app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
  });
}
init();
