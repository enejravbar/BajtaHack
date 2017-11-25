$(document).ready(function(){
  getRoomID();

  var room1={
    id:1,
    name:"Podstrešje",
    controller:{ip:"", connection:false, configuration:true},
    lights:[{offsetX:20/100, offsetY:20/100, gpioPin:2,selected:false,status:true},{offsetX:30/100, offsetY:30/100, gpioPin:3,selected:false,status:false},{offsetX:40/100, offsetY:40/100, gpioPin:4, selected:false,status:false}],
    numberOfLightsON:444,
    numberOfLightsOFF:333
  };

  var room = new Vue({
    el: '#room',
    data: {
      room:room1
    },
    methods: {
      redirect: function(room){
        console.log("redirect on /room",room.id)
        window.location.replace("/room"+room.id);
      },
      roomMapPath: function(room){
        return "uploads/room_"+room.id+".map";
      },
      drawRoomMapOnCanvas: function(room){
        var svg=$('#tloris');

        var imageObj = new Image();
        imageObj.src = this.roomMapPath(room);

        var sirinaSlike= $(window).width()/2;
        var visinaSlike= parseInt((sirinaSlike*imageObj.height)/imageObj.width);

        svg.width(sirinaSlike);
        svg.height(visinaSlike);

        var roomMap=createImageElement(sirinaSlike, visinaSlike, imageObj.src, 0, 0 );
        svg.append(roomMap);

        var light = new Image();
        light.src = "images/light_OFF.jpg";
        sirinaSlike= 40;
        visinaSlike= 40;
        console.log("Stevilo luči, ki so že dodane", room.lights.length)

        for (var i=0; i< room.lights.length;i++){
          var x=room.lights[i].offsetX*svg.width()-sirinaSlike/2;
          var y=room.lights[i].offsetY*svg.height()-visinaSlike/2;
          var novaLuc=createImageElement(sirinaSlike, visinaSlike, "images/light_OFF.jpg", x, y);
          room.lights[i].objectPointer=novaLuc; // assing each light object pointer for easy manage
          room.lights[i].selected=false;
          svg.append(novaLuc);
        }


      },
      selectLight: function(room){
        var svg=$('#tloris');

        var svgAlt=document.getElementById('tloris');

        var elements = svgAlt.childNodes;
        for (var i=1;i<elements.length;i++){
             elements[i].addEventListener('click', function(element){
               for(var i = 0; i<room.lights.length; i++){

                  if(this==room.lights[i].objectPointer){
                    for(var j = 0; j<room.lights.length; j++){
                      room.lights[j].selected=false;
                    }
                    room.lights[i].selected=true;
                    console.log("Zaznan klik na zarnico")
                  }
               }
             });
         }

      }

    },
    computed: {

    }

  });

  room.drawRoomMapOnCanvas(room1);
  room.selectLight(room1);

});

function getRoomID(){
  return parseInt((window.location+"").split("room")[1]);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function createImageElement(width, height, src, x, y ){
  var el = document.createElementNS('http://www.w3.org/2000/svg','image');
  el.setAttributeNS(null,'height',height);
  el.setAttributeNS(null,'width',width);
  el.setAttributeNS('http://www.w3.org/1999/xlink','href', src);
  el.setAttributeNS(null,'x',x);
  el.setAttributeNS(null,'y',y);
  el.setAttributeNS(null, 'visibility', 'visible');

  return el;
}
