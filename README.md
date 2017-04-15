--------------
Instructions:
--------------
After downloading, first install node.js on your machine. 

Then, open a terminal/command prompt, go to the folder with app.js file and type:

1. npm install 
(this step will create a directory node_modules and download all dependencies there)

2a. node app.js 
(this step will start the application app.js when testing locally)

2b. ./node_modules/forever/bin/forever start node.js
(this step will start the application app.js in deployment and monitor it continously. It will restart the app if it crashes. Check documentation at: https://github.com/foreverjs/forever. For example, to stop, type ./node_modules/forever/bin/forever stop node.js, to list all running applications that forever is monitoring, type ./node_modules/forever/bin/forever list)
-------------------------
Architecture/Other Notes:
-------------------------

Front End: 

- everything in html/js/css folder
- several 3rd party libraries used: plottable, high charts, dataTables
- Server IP address need to be set in miscutil.js (db_server_address)

Back End: 

- app.js is the main application running node.js and express 
- database stored in data/casino_tables.db (sqlite)
- app.js sets up a REST API around the sqlite DB which the front end uses to fetch/insert data
- app.js also runs a periodic update function that updates the occupancy table in the DB based on current games being played
- a simple thermal printer driver runs on app.js and is interfaced with the client application through a REST API command
- Printer IP address needs to be set in routes/index.js (printer_server_address towards the end of file)

