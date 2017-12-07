const request = require('request');

let token = undefined;

const getToken = () => token;
const setToken = (t) => token = t;

const customRequest = request.defaults({
  baseUrl: process.env.REACT_APP_API_URL,
  json: true,
  auth: {bearer: getToken},
});

module.exports = customRequest;
module.exports.setToken = setToken;
module.exports.getToken = getToken;