//3d Party Modules
const express = require("express");

const app = express();
app.listen(5500);
//Allow acces to static files
app.use(express.static('docs'));