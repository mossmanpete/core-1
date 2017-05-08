const {ipcRenderer} = require('electron');
let env;
let data;

exports.setEnv = function(lenv){
    env = lenv;
    console.log(lenv);
}


// handle request
exports.refresh = () => {
    console.log("Refreshing...");

    ipcRenderer.send('daemons-windows-get-all', {"app": "Window Manager", "id": env.id});
}

ipcRenderer.on('daemons-windows-get-all-response', (event, args) => {
    $("#running").html("");
    $("#zombie").html("");
    $("#suspended").html("");
    $("#exited").html("");
    $("#terminated").html("");

    var running = 0;
    var suspended = 0;
    var zombie = 0;
    var exited = 0;
    var terminated = 0;

    if(args.permission) {
        // handle parsing
        var i = 2;
        data = args.data;
        while(args.data[i] !== undefined) {
            // handle positioning
            if(args.data[i].state === "Running") {
                appendWindow("running", i, data[i]);
                running++;
                $("#running-ct").text(running);
            } else if(args.data[i].state === "Suspended") {
                appendWindow("suspended", i, data[i]);
                suspended++;
                $("#suspended-ct").text(suspended);
            } else if(args.data[i].state === "Zombie") {
                appendWindow("zombie", i, data[i]);
                zombie++;
                $("#zombie-ct").text(zombie);
            } else if(args.data[i].state === "Exited") {
                appendWindow("exited", i, data[i]);
                exited++;
                $("#exited-ct").text(exited);
            } else if(args.data[i].state === "Terminated") {
                appendWindow("terminated", i, data[i]);
                terminated++;
                $("#terminated-ct").text(terminated);
            } 

            i++;
        }
    }
})

function appendWindow(state, id, data){
    var now = Date.now();
    $("#"+state).append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+id+")' id='window"+id+"'>"+data.title+"<span class='purple-text'>#"+data.id+"</span><br /><small>Created <b>"+msToHuman(now - data.birth)+"</b> ago.<br />Created by <b>"+data.spawner+"</b>.<br /><span style='text-transform: uppercase;'>"+data.reason+"</span></small></p>");
}

exports.readMore = (id) => {
    console.log(data[id]);
    $("p").removeClass('window-selected');
    $("p#window"+id).addClass('window-selected');

    var now = Date.now();

    $("#rm-title").html(data[id].title + "<span class='purple-text'>#"+id+"</span>");
    $("#rm-age").text(msToHuman(now - data[id].birth) + " ago");
    $("#rm-status").text(data[id].state);
    $("#rm-creator").text(data[id].spawner);

    if(data[id].state == "Running" || data[id].state == "Zombie"){
        $("#rm-zc-send-remaining").text(((now - data[id].zombiesent))+" ms");
        $("#rm-zc-received-ago").text((now - data[id].zombiereceived)+" ms");

        $("#rm-zc-send").attr("style", "width: "+((now - data[id].zombiesent) / 30000)*100+"%");
        $("#rm-zc-receive").attr("style", "width: "+((now - data[id].zombiereceived) / 30000)*100+"%");

        $("#rm-zc-warn").hide();
        $("#rm-exit").hide();
        $("#rm-exit-msg").text("");
    } else {
        $("#rm-zc-warn").show();
        $("#rm-exit").show();
        $("#rm-zc-send-remaining").text("N/A ms");
        $("#rm-zc-received-ago").text("N/A ms");

        $("#rm-zc-send").attr("style", "width: 0%");
        $("#rm-zc-receive").attr("style", "width: 0%");

        $("#rm-exit-msg").text(data[id].reason);
    }




    
}

function msToHuman(ms) {

    // convert ms to human readable
    if(ms > 1000) {
        s = Math.floor(ms/1000);
        suf = "s";
    } else {
        return ms+"ms";
    }

    if(s > 60) {
        var m = Math.floor(s/60);
        suf = "m";
    } else {
        return s+suf;
    }

    if(m > 60) {
        var h = Math.floor(s/3600);
        suf = "h";
    } else {
        return m+suf;
    }

    if(h > 24) {
        var d = Math.floor(h/24);
        suf = "d";
        return d+suf;
    } else {
        return h+suf;
    }

}