const {ipcRenderer} = require('electron');
let window;
let id;

ipcRenderer.on('daemon-window-ctx', (event, arg) => {
    window = arg.window;
    id = arg.id;
    console.log("Daemon sent window context.");
})

exports.launch = function(app, ctx){
    ipcRenderer.send('launch-app', {"app": "Deck", "launching": app, "ctx": ctx, "window": window, "id": id});
    $(".deck.top > p").html("<i class='material-icons left red-text' style='font-size: 24px;'>open_in_new</i> Launching <b>"+app+"</b>...");
}

ipcRenderer.on('launch-app-state', (event, arg) => {
    if(!arg.launched){
        $(".deck.top > p").html("<i class='material-icons left red-text' style='font-size: 24px;'>warning</i> You cancelled the launch of <b>"+arg.args.launching+"</b>.");
    } else {
        $(".deck.top > p").html("<b>Webtop</b> Your Deck.");
    }
})