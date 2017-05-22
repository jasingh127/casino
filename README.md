--------------
Instructions:
--------------
After downloading, first install node.js on your machine. 

Then, open a terminal/command prompt, go to the folder with app.js file and type:

1. npm install 
(this step will create a directory node_modules and download all dependencies there)

2. Change db server IP address in js/misc.js (db_server_ip_address towards the beginning of the file)

3. Change printer IP address in routes/index.js (printer_server_address towards the end of the file)

4. Run the app. 

(option 1) node app.js 
(this step will start the application app.js when testing locally)

(option 2) On Mac/Linux, type ./node_modules/forever/bin/forever -a start app.js
(this step will start the application app.js in deployment and monitor it continously. It will restart the app if it crashes. Check documentation at: https://github.com/foreverjs/forever. For example, 
- to start, type ./node_modules/forever/bin/forever -a start app.js
- to stop, type ./node_modules/forever/bin/forever stop app.js
- to list all running applications that forever is monitoring, type ./node_modules/forever/bin/forever list

On Windows, type node node_modules/forever/bin/forever -a start app.js (i.e. preface forever command with node)

-------------------------
Architecture/Other Notes:
-------------------------

Front End: 

- everything in html/js/css folder
- several 3rd party libraries used: plottable, high charts, dataTables

Back End: 

- app.js is the main application running node.js and express 
- database stored in data/casino_tables.db (sqlite)
- app.js sets up a REST API around the sqlite DB which the front end uses to fetch/insert data
- app.js also runs a periodic update function that updates the occupancy table in the DB based on current games being played
- a simple thermal printer driver runs on app.js and is interfaced with the client application through a REST API command

