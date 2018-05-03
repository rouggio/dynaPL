var fs = require('fs');

exports.buildList = function (group, path) {
    var stream = fs.createWriteStream(path + "/" + group.name + '.m3u');
    stream.once('open', function (fd) {
        stream.write("#EXTM3U\n");

        //sort channels by name
        group.channels.sort(function(a, b) {return a.header.name > b.header.name ? 1 : ((b.header.name > a.header.name) ? -1 : 0);} );

        group.channels.forEach(channel => {
            //#EXTINF:-1 tvg-id="RAI 1 HD" tvg-name="Rai 1 HD" tvg-logo="http://5.196.95.49/iptv/rai1.png" group-title="ITALIA",Rai 1 HD
            //http://ovunque.tv:2300/live/online0032/G9izjEpHtz/9584.ts
            let header = channel.header;

            stream.write("#EXTINF:-1 ");
            if (header.id) {
                stream.write("tvg-id=\"" + header.id + "\" ");
            }
            if (header.name) {
                stream.write("tvg-name=\"" + header.name + "\" ");
            }
            // if (header.logo) {
                // stream.write("tvg-logo=\"" + header.logo + "\" ");
            // }
            if (header.group) {
                stream.write("group-title=\"" + header.group + "\" ");
            }
            if (header.name) {
                stream.write(", " + header.name);
            }

            stream.write("\n");

            stream.write(channel.url + "\n");
        });
        stream.end();
    });
}

exports.buildSettings = function(groups, baseURL, path) {
    /*
    [
        {
            "url": "http://ovunque.tv:2300/get.php?username=online0032&password=G9izjEpHtz&type=m3u_plus&output=ts", 
            "logos": "http://ovunque.tv:2300/get.php?username=online0032&password=G9izjEpHtz&type=m3u_plus&output=ts", 
            "image": "http://ovunque.tv:2300/get.php?username=online0032&password=G9izjEpHtz&type=m3u_plus&output=ts", 
            "cache": 0, 
            "name": "all"
        }
    ]
    */
    //sort groups  by name
    groups.sort(function(a, b) {return a.name > b.name ? 1 : ((b.name > a.name) ? -1 : 0);} );
  
    var stream = fs.createWriteStream(path + '/playLists.txt');
    stream.once('open', function (fd) {
        stream.write("[\n");
        groups.forEach(function(group, index, array) {
            let entry = {};
            entry.url = baseURL + '/' + group.filename;
            entry.name = group.displayName;
            entry.cache = 0;
            stream.write(JSON.stringify(entry));
            if (index < array.length -1) {
                stream.write(",\n");
            } else {
                stream.write("\n");
            }
        });
        stream.write("]\n");
        stream.end();
    });
}