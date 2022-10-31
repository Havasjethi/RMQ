// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const amqplib = require('amqplib');
const server_components = require('./server/dist/main');

console.log(server_components);
server_components.init_external_api({
  notify(connectionId, message, time) {},
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
}

function init() {
  app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('listen_to_queue', async (event, queue_name) => {
      server_components.external_api.listen_to_queue(queue_name);

      return 'OK';
    });

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
    if (process.platform !== 'darwin') app.quit();
  });
}
init();
