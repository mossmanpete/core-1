const electron = require('electron')
const windowsdaemon = require('./daemon/windows.js');

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = {};
let windowsi = 0;

function createWindow () {
  // Create the browser window.
  
  windows[0] = {};
  windows[0].window = new BrowserWindow({width: 800, height: 600, frame: true});
  windows[0].title = "Daemon loading";
  windows[0].state = "Running";

  // and load the index.html of the app.
  windows[0].window.loadURL(url.format({
    pathname: path.join(__dirname, 'daemon', 'deck.html'),
    protocol: 'file:',
    slashes: true
  }))

  windows[0].window.on('closed', function () {
    windows[0].window = null
    windows[0].state = "Exited";
  })

  // send window config
  windows[0].window.webContents.on('did-finish-load', () => {
    windows[0].window.webContents.send('daemon-window-ctx', {"id": windows[0].window.id, "window": windows[0].window});
  })

}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (windows[0].window === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const {ipcMain} = require('electron')

ipcMain.on('daemons-windows-get-all', (event, arg) => {
  // spawn elevation window and send prompt
  dialog = windowsdaemon.create(BrowserWindow, {"title": "Elevate", "file": "elevate.html", "ctx": "daemon", "width": "400", "height": "250", "frame": false, "spawner": arg.app});

  dialog.window.webContents.on('did-finish-load', () => {
    dialog.window.webContents.send('daemons-permission-request', {"source": arg.app, "endpoint": arg.app, "message": "access all Webtop windows", "return": "daemons-permission-request-windowreader", "passthrough": {"dialog": dialog.id, "args": arg}, "help": "Allowing this request will give <b>"+arg.app+"</b> access to all your currently open Webtop windows."});
  })
});

ipcMain.on('daemons-permission-request-windowreader', (event, arg) => {
  // relay response back to initial window (DEBUG ONLY)
  console.log(arg);

  dialog = BrowserWindow.fromId(arg.passthrough.args.id);

  if(arg.state){
    dialog.webContents.send('daemons-windows-get-all-response', {"permission": true, "data": windowsdaemon.getAll()});
  } else {
    dialog.webContents.send('daemons-windows-get-all-response', {"permission": false})
  }

  windowsdaemon.kill(arg.passthrough.dialog, 3);
})





// handle app launcher
ipcMain.on('launch-app', (event, arg) => {
  
  // spawn elevation window and send prompt
  dialog = windowsdaemon.create(BrowserWindow, {"title": "Switch apps", "file": "elevate.html", "ctx": "daemon", "width": "400", "height": "250", "frame": false, "spawner": arg.app});

  dialog.window.webContents.on('did-finish-load', () => {
    dialog.window.webContents.send('daemons-permission-request', {"source": arg.app, "endpoint": arg.launching, "message": "switch to <b>"+arg.launching+"</b>", "return": "daemons-permission-request-swapapp", "passthrough": {"dialogid": dialog.id, "args": arg}, "help": ""});
  })

});

ipcMain.on('daemons-permission-request-swapapp', (event, arg) => {
  console.log(arg);

  dialog = BrowserWindow.fromId(arg.passthrough.args.id);

  if(arg.state) {
    lapp = windowsdaemon.create(BrowserWindow, {"title": arg.passthrough.args.launching, "file": "index.html", "ctx": arg.passthrough.args.ctx, "width": 800, "height": 600, "frame": true, "spawner": arg.passthrough.args.app});
    dialog.webContents.send('launch-app-state', {"launched": true, "args": arg.passthrough.args});
  } else {
    dialog.webContents.send('launch-app-state', {"launched": false, "args": arg.passthrough.args});
  }

  windowsdaemon.kill(arg.passthrough.dialogid, 3);
})