require('dotenv').config();
const ENV = process.env;

const port = ENV.PORT || 3000;
const hapi = ENV.HAPI || "https://api.hive.blog";
const img = ENV.IMG || "/img/dlux-icon-192.png"

module.exports = {
    port,
    hapi,
    img
}