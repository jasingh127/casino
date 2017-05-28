--------------
Instructions:
--------------
After downloading, first install node.js on your machine. 

Then, open a terminal/command prompt, go to the folder with app.js file and type:

1. npm install 
(this step will create a directory node_modules and download all dependencies there)

2. Change db server IP address in js/misc.js (db_server_ip_address towards the beginning of the file)

3. Change printer IP address in routes/index.js (printer_server_address towards the end of the file)

4. Run the app by typing: node app.js 
(this step will start the application app.js when testing locally)

5. If you want to run the app as a service on windows: 

There are free open-source ways of doing this, but we highly recommend installing AlwaysUp:

https://www.coretechnologies.com/products/AlwaysUp/

https://www.youtube.com/watch?v=4desRWHp4tY&t=9s

It's free for 30 days and costs 50$ per license. It's extremely easy to use and seems quite robust and comes with many nice features (like emailing you the app activity).

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

