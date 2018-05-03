const http = require('http');

exports.retrieveData = function(url) {

	return new Promise((resolve, reject) => {
		console.log('using list url: ' + url);

		const request = http.get(url, (resp) => {
			const data = [];

			if (resp.statusCode < 200 || resp.statusCode > 299) {
				reject(new Error('failed to load list, error code: ' + response.statusCode));
			}

			resp.on('data', (chunk) => {
		    		data.push(chunk);
		  	});

			resp.on('end', () => {
				resolve(data.join(''));
		  	});

		});

		request.on('error', (err) => reject(err))
	});
}