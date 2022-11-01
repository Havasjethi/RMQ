// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const amqplib = require('amqplib');
const server_components = require('./server/dist/main');

/** @type{electron.WebContents}
 */
let main_window_web_contents;
console.log(server_components);
server_components.init_external_api({
  notify(connectionId, message, time) {
    // console.log('Hello', connectionId, message);
    try {
      // const target = 'message';
      const target = 'message-' + connectionId;
      console.log('Sending to : ', target, message);
      // main_window_web_contents.channel;
      main_window_web_contents.send(target, message, time);
    } catch (e) {
      console.log(e);
    }
  },
  notifyError(connectionId, message, time) {},
});

server_components.main();
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  main_window_web_contents = mainWindow.webContents;
}

function initHandlers() {
  ipcMain.handle('listen_to_queue', async (event, queue_name) => {
    return server_components.external_api.listen_to_queue(queue_name);
  });
  ipcMain.handle('unsubscribe', async (event, id) => {
    server_components.external_api.unsubscribe(id);
  });

  ipcMain.handle('listen_to_private_queue', async (event) =>
    server_components.external_api.listen_to_private_queue()
  );
  ipcMain.handle('subscribe_to_queue', (event, id, listener) => {
    server_components.external_api;
  });
  ipcMain.handle('setup_state', (event, state_index) => {
    console.log('Got stateIndex:', state_index);
    server_components.external_api.load_configuration(state_index);
  });
  ipcMain.on('send_message', (event, exchange, routing_key, message) => {
    server_components.external_api;
    // ipcRenderer.invoke('send_message', exchange, routing_key, message);
  });
}
function init() {
  app.whenReady().then(() => {
    createWindow();
    initHandlers();

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    server_components.shutdown;
    if (process.platform !== 'darwin') app.quit();
  });
}
init();
