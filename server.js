var util = require("util");
var express = require('express');
var path = require('path');
var bodyParser= require('body-parser');
var multer = require('multer');
var mysql = require('mysql');

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
	    host: "192.168.10.1",
	    user: "root",
	    password: "geslo",
	    database: "imePodatkovneBaze",
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

streznik.post("/izbrisiVseZapise", function(zahteva,odgovor){
	pool.getConnection(function(napaka1, connection) {

	        if (!napaka1) {
	        	console.log('DELETE FROM meritve;');
	            connection.query('DELETE FROM meritve;', function(napaka2, info) {
	                if (!napaka2) {
	                    odgovor.json({
	                    	uspeh:true
	                    });
	                } else {
	                    odgovor.json({
	                    	uspeh:false,
	                    	odgovor:"Napaka! Brisanje zapisov ni bilo uspešno!"
	                    });
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
