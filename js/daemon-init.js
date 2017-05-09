const {ipcRenderer} = require('electron')

$(document).ready(function(){
    console.log("ready");

    var launchtimer = setInterval(incrementTimer, 1000);

    ipcRenderer.on('daemons-windows-get-all-response', (event, arg) => {
        console.log(arg) // prints "pong"
    })
    ipcRenderer.send('daemons-windows-get-all', {"app": "Daemon Initializer"})
});

var secElapsed = 0;

function incrementTimer(){
    secElapsed++;
    $("#countdown").text(secElapsed+"s elapsed");

    if(secElapsed > 60){
        $("#humor").text("Okay, more than a moment...");
    }
}