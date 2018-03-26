var config = {};

config.multitenancy = false;

config.web = {};
config.web.port = process.env.WEB_PORT || 9980;

config.googlemap = {};
config.googlemap.apiUrl = "https://maps.googleapis.com/maps/api/geocode/json";
config.googlemap.apiKey = "AIzaSyAjaLDT3aVxqbdf-7xtmqCcwVMAEXDMYeE";

config.backend = {};

config.secure = {};

config.plugins = [];
//config.plugins.push("./routes/plugins/sample-plugin.js");

module.exports = config;
