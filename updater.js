var path = require('path');
var fs = require('fs');
var fetch = require('./fetcher');
var parser = require('./parser');
var writer = require('./writer');

console.log('--------------------------------------------------------------------------------------------------------------');
console.log('update started at ' + new Date());
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf8'));


fetch.retrieveData(config.listURL).then(data => {

	let records = parser.parse(data, config);
	console.log('records found:' + records.length);

	records = parser.applyRules(records, config);

	let groups = parser.buildGroups(records, config);
	console.log('groups found:' + groups.length);

	let channels = 0;
	groups.forEach(group => {
		writer.buildList(group, config.pathToPlaylists);
		console.log("- group: " + group.name + " - channels: " + group.channels.length);
		channels += group.channels.length;
	});
	console.log("total channels: " + channels);

	writer.buildSettings(groups, config.playlistsBaseURL, config.pathToSettings);

	console.log('update done at ' + new Date());

})
.catch(err => {
	console.error(err);
});
