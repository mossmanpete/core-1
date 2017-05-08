const {ipcRenderer} = require('electron');
let env;

ipcRenderer.on('daemon-window-ctx', (event, args) => {
    env = args;
    console.log('Daemon sent window context.');
})

window.onbeforeunload = (e) => {
  console.log('Sending daemon window information before closing.')

  ipcRenderer.send('daemon-window-close', {"args": env});
}

exports.getEnv = function(){
    return env;
}

// handle zombie
ipcRenderer.on('daemon-window-alive', (e, a) => {

    ipcRenderer.send('daemon-window-alive-callback', {"id": a.id});

})