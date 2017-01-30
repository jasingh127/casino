// Main Server side application code

// Module dependencies
var express = require('express');
var routes = require('./routes');
var path = require('path');
var sqlite = require('sqlite3').verbose();
var fs = require('fs');

var app = express();
app.set('port', process.env.PORT || 3000);
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname));
var cors = require('cors');
app.use(cors());

// Initialize DB
function createDatabase() {
  console.log("Initializing DB connection...")
  // Create db tables
  db = new sqlite.Database(path.join(__dirname, 'data/sample.db'));
}

createDatabase();

// Add routes
app.get('/', routes.index);
app.get('/timetable', routes.timetable);
app.get('/refreshDb', routes.refreshDb);
app.get('/fetchGames', routes.fetchGames)
app.post('/fetchOccupancy', routes.fetchOccupancy);
app.post('/insertOccupancy', routes.insertOccupancy);
app.post('/insertTables', routes.insertOccupancy);
app.post('/insertGames', routes.insertOccupancy);

app.listen(app.get('port'), function(){
  console.log("Casino app listening on port " + app.get('port'));
});