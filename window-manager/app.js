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
    console.log(args);
    console.info("Refresh completed.");

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
        while(args.data[i] != undefined) {
            console.log(args.data[i]);

            var now = Date.now();

            // handle positioning
            if(args.data[i].state == "Running") {
                $("#running").append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+i+")' id='window"+i+"'>"+args.data[i].title+"<span class='purple-text'>#"+args.data[i].id+"</span><br /><small>Created <b>"+msToHuman(now - args.data[i].birth)+"</b> ago.<br />Created by <b>"+args.data[i].spawner+"</b>.</small></p>");
                running++;
                $("#running-ct").text(running);
            } else if(args.data[i].state == "Suspended") {
                $("#suspended").append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+i+")' id='window"+i+"'>"+args.data[i].title+"<span class='purple-text'>#"+args.data[i].id+"</span><br /><small>Created <b>"+msToHuman(now - args.data[i].birth)+"</b> ago.<br />Created by <b>"+args.data[i].spawner+"</b>.<br /><span style='text-transform: uppercase;'>"+args.data[i].reason+"</span></small></p>");
                suspended++;
                $("#suspended-ct").text(suspended);
            } else if(args.data[i].state == "Zombie") {
                $("#zombie").append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+i+")' id='window"+i+"'>"+args.data[i].title+"<span class='purple-text'>#"+args.data[i].id+"</span><br /><small>Created <b>"+msToHuman(now - args.data[i].birth)+"</b> ago.<br />Created by <b>"+args.data[i].spawner+"</b>.<br /><span style='text-transform: uppercase;'>"+args.data[i].reason+"</span></small></p>");
                zombie++;
                $("#zombie-ct").text(zombie);
            } else if(args.data[i].state == "Exited") {
                $("#exited").append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+i+")' id='window"+i+"'>"+args.data[i].title+"<span class='purple-text'>#"+args.data[i].id+"</span><br /><small>Created <b>"+msToHuman(now - args.data[i].birth)+"</b> ago.<br />Created by <b>"+args.data[i].spawner+"</b>.<br /><span style='text-transform: uppercase;'>"+args.data[i].reason+"</span></small></p>");
                exited++;
                $("#exited-ct").text(exited);
            } else if(args.data[i].state == "Terminated") {
                $("#terminated").append("<br /><p class='waves-effect waves-light' onclick='wm.readMore("+i+")' id='window"+i+"'>"+args.data[i].title+"<span class='purple-text'>#"+args.data[i].id+"</span><br /><small>Created <b>"+msToHuman(now - args.data[i].birth)+"</b> ago.<br />Created by <b>"+args.data[i].spawner+"</b>.<br /><span style='text-transform: uppercase;'>"+args.data[i].reason+"</span></small></p>");
                terminated++;
                $("#terminated-ct").text(terminated);
            } else {
                console.warn("Could not handle:");
                console.log(args.data[i]);
            }

            i++;
        }
    }
})

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
        var h = Math.floor(m/60);
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