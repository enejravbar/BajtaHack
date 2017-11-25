var util = require("util");
var express = require('express');
var path = require('path');
var bodyParser= require('body-parser');
var multer = require('multer');
var mysql = require('mysql');
var groupBy = require('group-by');

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
		var ip = zahteva.body.ipAddress;
		if (!napaka1) {
			console.log(name);
			//console.log(roomDescription);
			var post  = {roomName: name, roomDescription: roomDescri, ipAddress:ip};
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

streznik.post("/saveConfiguration", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
		var tabela = zahteva.body.lightsConfiguration;
		if (!napaka1) {
			console.log(zahteva.body.lightsConfiguration[0])
			var query = connection.query('DELETE FROM room_lights WHERE roomID ='+zahteva.body.roomID, function (error, results, fields) {
				if (error) throw error;
				else{
					for(var i = 0; i< tabela.length; i++){
						var post  = {roomID: zahteva.body.roomID, offsetX: tabela[i].offsetX, offsetY: tabela[i].offsetY, gpioPin: tabela[i].gpioPin, lightStatus: tabela[i].status};
						var query = connection.query('INSERT INTO room_lights SET ?', post, function (error, results, fields) {
							if (error) throw error;

						});
						//connection.release();
					}
				}
			});
		} else {
			odgovor.json({
				uspeh:false,
				odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
			});
		}
	});
})

streznik.post("/removeRoom", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
		if (!napaka1) {
			var query = connection.query('DELETE FROM room WHERE roomID ='+zahteva.body.roomID, function (error, results, fields) {
				if (error) throw error;

			});
		} else {
			odgovor.json({
				uspeh:false,
				odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
			});
		}
	});
})

streznik.get("/getRooms", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
		if (!napaka1) {
			var query = connection.query('SELECT r.roomID,r.roomName FROM room r', function (error, results, fields) {
				if (error) throw error;
				//console.log(results[0]);

				var tabela_data = [];

				console.log(results);
				if(results.length==0){
					console.log("RESULTS JE PRAZNA!!!!!!!!!!!!!!!!!!!!!!")
					odgovor.send([]);
				} else{
					var objekt0 = {
  					id:results[0].roomID,
  					name:results[0].roomName
					};

					for(var i=1; i<results.length; i++){
						if( results[i-1].roomID !=  results[i].roomID){
							tabela_data.push(objekt0);
							var objekt1={
								id:results[i].roomID,
								name:results[i].roomName
							}
							objekt0=objekt1;
						}
					}						
					tabela_data.push(objekt0);
					odgovor.send(tabela_data);
					console.log(tabela_data);
				}
			});
		} else {
			odgovor.json({
				uspeh:false,
				odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
			});
		}
	});
})


streznik.get("/getRoomsConfg", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
		if (!napaka1) {
			var query = connection.query('SELECT r.roomID,r.roomName,r.ipAddress,l.offsetX,l.offsetY,l.gpioPin,l.lightStatus  FROM room r,room_lights l WHERE r.roomID = l.roomID', function (error, results, fields) {
				if (error) throw error;
				//console.log(results[0]);
				var j = 1;

				var tabela_data = [];

        console.log(results);
				if(results.length==0){
          console.log("RESULTS JE PRAZNA!!!!!!!!!!!!!!!!!!!!!!")
					odgovor.send([]);
				} else{
					var objekt0 = {
  					id:results[0].roomID,
  					name:results[0].roomName,
					controller:{ip:results[0].ipAddress},
  					lights:[{
  						offsetX:results[0].offsetX,
  						offsetY:results[0].offsetY,
  						gpioPin:results[0].gpioPin,
  						status:results[0].lightStatus
  					}]
					};

					for(var i=1; i<results.length; i++){

						if( results[i-1].roomID !=  results[i].roomID){
							tabela_data.push(objekt0);
							var objekt1={
								id:results[i].roomID,
								name:results[i].roomName,
								controller:{ip:results[i].ipAddress},
								lights:[{
									offsetX:results[i].offsetX,
									offsetY:results[i].offsetY,
									gpioPin:results[i].gpioPin,
									status:results[i].lightStatus
								}]
							}
							objekt0=objekt1;
						}else{
							objekt0.lights.push({
									offsetX:results[i].offsetX,
									offsetY:results[i].offsetY,
									gpioPin:results[i].gpioPin,
									status:results[i].lightStatus
							});
						}

  				}
  				tabela_data.push(objekt0);

          odgovor.send(tabela_data);

  				console.log(tabela_data);
        }


			});
		} else {
			odgovor.json({
				uspeh:false,
				odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
			});
		}
	});
})

streznik.get("/getRoom:id", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {
		if (!napaka1) {
			var query = connection.query('SELECT r.roomID,r.roomName,l.offsetX,l.offsetY,l.gpioPin,l.lightStatus  FROM room r,room_lights l WHERE r.roomID = l.roomID AND r.roomID='+zahteva.params.id, function (error, results, fields) {
				if (error) throw error;
				var objekt0 = {
					roomID:results[0].roomID,
					roomName:results[0].roomName,
					ipAddress:results[0].ipAddress,
					lights:[{
						offsetX:results[0].offsetX,
						offsetY:results[0].offsetY,
						gpioPin:results[0].gpioPin,
						lightStatus:results[0].lightStatus
					}]
				};
			});
			odgovor.send(tabela_data);
		} else {
			odgovor.json({
				uspeh:false,
				odgovor:"Napaka pri vzpostavitvi povezave z podatkovno bazo!"
			});
		}
	});
})
