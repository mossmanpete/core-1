let windows = {};
let wi = 0;
const path = require('path')
const url = require('url')
const {ipcMain} = require('electron')

exports.getAll = function(){
    return windows;
}
exports.create = function(bw, app){
    /*
        app.title is window title
        app.file is file to open as
        app.tabbed is whether or not to embed tabbed shell
        app.frame is whether or not to surround with UI shell
        app.ctx is app folder
        app.width is width
        app.height is height
        app.spawner is the parent app
    */


    // make sure this is numeric
    if(Number(app.width) == NaN){ 
        width = 800;
    } else {
        width = Number(app.width);
    }

    if(Number(app.height) == NaN){ 
        height = 600;
    } else {
        height = Number(app.height);
    }
    
    frame = Boolean(app.frame);

    tmpwin = new bw({width: width, height: height, frame: frame});
    wi = tmpwin.id;
    
    console.log("App ("+app.title+") spawned a new window (#"+wi+") loading file "+app.ctx+"/"+app.file);

    windows[wi] = {};
    windows[wi].window = tmpwin;
    windows[wi].title = app.title;
    windows[wi].state = "Running";
    windows[wi].id = wi;
    windows[wi].birth = Date.now();
    windows[wi].spawner = app.spawner;
    windows[wi].reason = "";

    // handle zombie
    windows[wi].zombiereceived = 0;
    windows[wi].zombiesent = Date.now();

    windows[wi].window.loadURL(url.format({
        pathname: path.join(__dirname, "..", app.ctx, app.file),
        protocol: 'file:',
        slashes: true
    }))

    // Emitted when the window is closed.
    windows[wi].window.on('closed', function (e) {
        console.log("A window has closed.\r\nDereference will occur once ipc event is received.");
    });

    // send window config + zombie push
    windows[wi].window.webContents.on('did-finish-load', () => {
        windows[wi].window.webContents.send('daemon-window-ctx', {"id": windows[wi].id, "window": windows[wi].window});
        windows[wi].window.webContents.send('daemon-window-alive', {"id": windows[wi].id})
    })

    return windows[wi];

}

exports.zombie = function(id) {
    if(windows[id].window == undefined){
        return {"state": "error", "message": "Unknown window"};
    } else {
        windows[id].window.hide();
        windows[id].state = "Zombie";
        windows[id].reason = "Zombified by function call.";
        return {"state": "success"};
    }
}

exports.terminate = function(id) {
    if(windows[id].window == undefined){
        return {"state": "error", "message": "Unknown window"};
    } else {
        windows[id].window.destroy();
        windows[id].state = "Terminated";
        windows[id].reason = "Terminated by function call.";
        return {"state": "success"};
    }
}

exports.close = function(id) {
    if(windows[id].window == undefined){
        return {"state": "error", "message": "Unknown window"};
    } else {
        windows[id].window.close();
        windows[id].state = "Exited";
        windows[id].reason = "Closed by function call."
        return {"state": "success"};
    }
}

ipcMain.on('daemon-window-close', (events, args) => {
    console.log("Window #"+args.args.id+" is closed.");
    windows[args.args.id].window = null;
    windows[args.args.id].state = "Exited";
    // make sure we don't overwrite any other messages prior to this always declared message
    if(windows[args.args.id].state == ""){
        windows[args.args.id].reason = "Window sent close signal."
    }
});

// Zombie checking
// not sponsored by The Walking Dead
ipcMain.on('daemon-window-alive-callback', (events, args) => {
    if(windows[args.id] == undefined) {
        console.log("Received a zombie check for Window ID#"+args.id+" but it does not relate to any active window.");
    } else {
        windows[args.id].state = "Running";
        windows[args.id].zombiereceived = Date.now();
    }
});

var zombiecheck = setInterval(checkZombies, 15000);

function checkZombies(){
    var i = 2;
    while(windows[i] != undefined) {
        var now = Date.now();
        if(windows[i].state == "Running" || windows[i].state == "Zombie") {
            if(now - windows[i].zombiesent > 30000 && windows[i].zombiereceived == 0 && windows[i].window != null){
                // 30s elapsed and still no initial received -- terminate
                windows[i].window.close();
                windows[i].window = null;
                windows[i].state = "Terminated";
                windows[i].zombiesent = 0;
                windows[i].zombiereceived = 0;
                windows[i].reason = "Failed to respond to initial zombie check.";
                console.log("Window #"+i+" was terminated due to no respone on initial.");
            } else if(now - windows[i].zombiesent > 30000 && now - windows[i].zombiereceived > 30000 && windows[i].zombiesent + windows[i].zombiereceived > 100000 && windows[i].window != null){
                // 30s elapsed since send and receive -- zombie & resend
                windows[i].state = "Zombie";
                windows[i].reason = "Failed to respond to zombie check in timely manner.";
                windows[i].zombiesent = Date.now();
                windows[i].window.webContents.send('daemon-window-alive', {"id": windows[i].id});
                console.log("Window #"+i+" was demoted to zombie due to zombie check timeout.");
            } // ignore everything else

            console.log("ZOMBIE CHECK - #"+i+": Sent "+(now - windows[i].zombiesent)+"ms ago - Received: "+(now - windows[i].zombiereceived)+"ms ago\r\nZOMBIE CHECK - Difference: "+((now - windows[i].zombiesent) + (now - windows[i].zombiereceived))+"ms")
        }
        i++;
    }
}