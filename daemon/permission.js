const {ipcRenderer} = require('electron')
let arg;

// handle request
ipcRenderer.on('daemons-permission-request', (event, arg) => {
    /*
        arg.source - Requesting app
        arg.endpoint - App being affected
        arg.message - Request message
        arg.help - Help message
        arg.return - Return IPC channel
    */
    escape(arg);

    $("#loading").fadeOut();
    $("#content").fadeIn();

    $("#header").html("The app <b>"+arg.source+"</b> wants to "+arg.message+".");
    $("#specific").html(arg.help+"<br />Allow or deny this request below.");
})


exports.denyElevate = function() {
    $("#specific").html("This request has been <b>denied</b>.<br />You will be returned back to your original app shortly.");
    $("div.right").fadeOut();
    ipcRenderer.send(arg.return, {"source": arg.source, "endpoint": arg.endpoint, "message": arg.message, "help": arg.help, "state": false, "passthrough": arg.passthrough});
}

exports.allowElevate = function() {
    $("#specific").html("This request has been <b>allowed</b>.<br />You will be returned back to your original app shortly.");
    $("div.right").fadeOut();
    ipcRenderer.send(arg.return, {"source": arg.source, "endpoint": arg.endpoint, "message": arg.message, "help": arg.help, "state": true, "passthrough": arg.passthrough});
}

function escape(larg){
    arg = larg;
}