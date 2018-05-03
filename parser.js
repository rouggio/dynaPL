exports.parse = function (data, config) {

    console.log('bytes read: ' + data.length);
    let lines = data.split(/\r\n|\r|\n/g);
    console.log('lines: ' + lines.length);

    let records = [];

    let channelData = {};
    for (var i = 0; i < lines.length; i++) {
        let position = lines[i];
        handleRow(position, channelData, config);
        if (channelData.url) {
            if (channelData.header) {
                records.push(channelData);
            }
            channelData = {};
        }
    }
    return records;
}

handleRow = function (row, channelData, config) {
    /*
    #EXTINF:-1 tvg-id="RAI 1 HD" tvg-name="Rai 1 HD" tvg-logo="http://5.196.95.49/iptv/rai1.png" group-title="ITALIA",Rai 1 HD
    http://ovunque.tv:2300/live/online0032/G9izjEpHtz/9584.ts
    #EXTINF:-1 tvg-id="" tvg-name="===SCOOBY.DOO===" tvg-logo="http://sasuketv.iptvitalia.eu:2300/images/0267913.jpg" group-title="Cartoni",===SCOOBY.DOO===
    http://ovunque.tv:2300/movie/online0032/G9izjEpHtz/33761.mkv
    #EXTINF:-1 tvg-id="" tvg-name="Be Cool Scooby Doo 1x01 L Universita Di Kingston" tvg-logo="http://sasuketv.iptvitalia.eu:2300/images/0267913.jpg" group-title="Cartoni",Be Cool Scooby Doo 1x01 L Universita Di Kingston
    http://ovunque.tv:2300/movie/online0032/G9izjEpHtz/33739.mkv
    */
    if (row.startsWith('#EXTINF')) {
        channelData.header = handleHeader(row);
    } else if (row.startsWith('http')) {
        channelData.url = row;
    }
}

exports.applyRules = function(channels, config) {
    let filteredChannels = [];

    channels.forEach(channel => {
        if (channel.header) {
            if (!applyDiscardRules(channel, config)) {

                applyGroupToGroupOverrides(channel, config.groupToGroupOverrides);
                applyNameToGroupOverrides(channel, config.nameToGroupOverrides);
    
                // capitalise display name
                channel.header.displayName = capitalize(channel.header.group);
                // technical group name with underscores
                channel.header.group = channel.header.displayName.replace(/ /g, '_');

                filteredChannels.push(channel);
            }
        }
    });
    return filteredChannels;
}

applyDiscardRules = function(channel, config) {
    for (let i = 0; i < config.discardNamePatterns.length; i++) {
        let entry = config.discardNamePatterns[i];
        if (channel.header.name.match(new RegExp(entry, "i"))) {
            return true;
        }
    }
    for (let i = 0; i < config.discardGroupPatterns.length; i++) {
        let entry = config.discardGroupPatterns[i];
        if (channel.header.group.match(new RegExp(entry, "i"))) {
            return true;
        }
    }
    return false;
}

applyGroupToGroupOverrides = function(channel, groupToGroupOverrides) {
    groupToGroupOverrides.forEach(override => {
        if (channel.header.group.match(new RegExp(override.sourceGroup, "i"))) {
            channel.header.group = override.targetGroup;
        }
    });
}

applyNameToGroupOverrides = function(channel, nameToGroupOverrides) {
    nameToGroupOverrides.forEach(override => {
        if (channel.header.name.match(new RegExp(override.namePattern, "i"))) {
            channel.header.group = override.targetGroup;
        }
    });
}

handleHeader = function (row) {
    /*
    #EXTINF:-1 tvg-id="RAI 1 HD" tvg-name="Rai 1 HD" tvg-logo="http://5.196.95.49/iptv/rai1.png" group-title="ITALIA",Rai 1 HD
    #EXTINF:-1 tvg-id="" tvg-name="===SCOOBY.DOO===" tvg-logo="http://sasuketv.iptvitalia.eu:2300/images/0267913.jpg" group-title="Cartoni",===SCOOBY.DOO===
    #EXTINF:-1 tvg-id="" tvg-name="Be Cool Scooby Doo 1x01 L Universita Di Kingston" tvg-logo="http://sasuketv.iptvitalia.eu:2300/images/0267913.jpg" group-title="Cartoni",Be Cool Scooby Doo 1x01 L Universita Di Kingston
    */
    let header = {};

    var id = resolve(row, /.*tvg-id="(.*?)".*/g);
    if (id) {
        header.id = id;
    }

    var name = resolve(row, /.*tvg-name="(.*?)".*/g);
    if (name) {
        //skip all fake group headers
        if (name.indexOf("===") > -1 || name.indexOf("---") > -1) {
            return null;
        }

        header.name = capitalize(name);
    } else {
        return null;
    }

    var logo = resolve(row, /.*tvg-logo="(.*?)".*/g);
    if (logo) {
        header.logo = logo;
    }

    var group = resolve(row, /.*group-title="(.*?)".*/g);
    if (group) {
        //replace white spaces with _, then capitalize
        header.group = group;
    } else {
        header.group = 'Ungrouped';
    }

    return header;
}

capitalize = function(s) {
    return s.toLowerCase().replace( /\b./g, function(a){ return a.toUpperCase(); } );
};

resolve = function (row, pattern) {
    var match = pattern.exec(row);
    if (match) {
        return match[1];
    }
}

exports.buildGroups = function (records, config) {
    let groups = [];
    records.forEach(rec => {
        let group = groups.find(group => { return group.name == rec.header.group });
        if (!group) {
            group = {
                "name": rec.header.group,
                "filename": rec.header.group + '.m3u',
                "displayName": rec.header.displayName, 
                "channels": [] 
            };
            groups.push(group);
        }
        group.channels.push(rec);
    });

    return groups;
}