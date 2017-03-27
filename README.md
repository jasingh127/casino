--------------
Instructions:
--------------
After downloading, first install node.js on your machine. 

Then go to the folder with app.js file and type:

npm install

node app.js

-------------
Architecture:
-------------

Front End: 

- everything in html/js/css folder
- uses the plottable.js library extenstively

Back End: 

- app.js is the main application running node.js and express 
- database stored in data/casino_tables.db (sqlite)
- app.js sets up a REST API around the sqlite DB which the front end uses to fetch/insert data
- app.js also runs a periodic update function that updates the occupancy table in the DB based on current games being played


