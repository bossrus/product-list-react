const axios = require('axios');

module.exports = async (request, response) => {
	try {
		const apiResponse = await axios({
			method: request.method,
			url: `http://api.valantis.store:40000${request.url}`,
			data: request.body,
		});
		response.send(apiResponse.data);
	} catch (error) {
		response.status(500).send({ error: 'Error connecting to API' });
	}
};
