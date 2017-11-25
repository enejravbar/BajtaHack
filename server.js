var util = require("util");
var express = require('express');
var path = require('path');
var bodyParser= require('body-parser');
var multer = require('multer');
var mysql = require('mysql');

if (!process.env.PORT)
  process.env.PORT = 8080;

var streznik = express();

var storage = multer.diskStorage({
  destination: function (zahteva, file, callback) {
    callback(null, __dirname+'/public/uploads/')
  },
  filename: function(zahteva, file, callback) {
      callback(null, "room_"+zahteva.body.roomId+".map");
  }
});

var upload = multer({ storage: storage });

streznik.use(upload.single('image'));
streznik.use(bodyParser.json());
streznik.use(express.static(path.join(__dirname, 'public')));


var fs = require('fs');
var http = require('http');

var httpServer = http.createServer(streznik);

pool = mysql.createPool({
	    host: "192.168.0.100",
	    user: "root",
	    password: "root",
	    database: "bajtahack",
	    charset: "UTF8_GENERAL_CI"
	});

httpServer.listen(80, function(){
	console.log("Streznik posluša na vratih 80.");
});

streznik.get("/", function(zahteva, odgovor){
  console.log("Prejel sem zahtevo na /");
	odgovor.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
})

streznik.get("/room:id", function(zahteva, odgovor){
  console.log("Prejel sem zahtevo na /room" +zahteva.params.id);
	odgovor.sendFile(path.join(__dirname, 'public', 'room.html'));
})

streznik.post("/uploadRoomMap", function(zahteva, odgovor){

  var idSobe=zahteva.body.roomId;
  var imeSlike=zahteva.file.originalname;
  console.log("Dobil sem zahtevek na /addRoomMap roomId=", zahteva.body.roomId," imeSlike=",imeSlike);
	odgovor.redirect("/");
})

streznik.post("/addRoom", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
            var name = zahteva.body.roomName;
            var roomDescri = zahteva.body.roomDescription;
	        if (!napaka1) {
	        	console.log(name);
				//console.log(roomDescription);
				var post  = {roomName: name, roomDescription: roomDescri, controllerID:null};
				var query = connection.query('INSERT INTO room SET ?', post, function (error, results, fields) {
				if (error) throw error;
					//sth,
					
				});

	            connection.release();

	        } else {
	            odgovor.json({
                	uspeh:false,
                	odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
                });
	        }
	    });
})

streznik.post("/addController", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
            var romID = zahteva.body.roomID;
            var ip = zahteva.body.ipAddress;
	        if (!napaka1) {
	        	console.log(name);
				//console.log(roomDescription);
				var post  = {ipAddress: ip};
				var query = connection.query('INSERT INTO controller SET ?', post, function (error, results, fields) {
					if (error) throw error;
					else{
						var conID = results.controllerID;
						console.log(results)
						console.log(conID)
						var post1  = {roomID: romID};
						//var query1 = connection.query('UPDATE room SET controllerID = ? WHERE last_name ='+conID, post, function (error, results, fields) {
						//	if (error) throw error;
						//});
					}
				});

	            connection.release();

	        } else {
	            odgovor.json({
                	uspeh:false,
                	odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
                });
	        }
	    });
})
