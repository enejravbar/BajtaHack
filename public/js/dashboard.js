$(document).ready(function(){
  var room1={
    id:1,
    name:"Podstrešje",
    controller:{ip:"", connection:false, configuration:true},
    lights:[],
    GPIOConfiguration:[],
    numberOfLightsON:444,
    numberOfLightsOFF:333
  };

  var room2={
    id:2,
    name:"Garaža",
    controller:{ip:"", connection:true, configuration:false},
    lights:[],
    GPIOConfiguration:[],
    numberOfLightsON:12,
    numberOfLightsOFF:6
  };

  var roomsMenu = new Vue({
    el: '#rooms-list',
    data: {
      connectionNotification:"",
      rooms: [room1,room2]
    },
    methods: {
      redirect: function(room){
        console.log("redirect on /room",room.id)
        window.location.replace("/room"+room.id);
      },
      roomMapPath: function(room){
        return "uploads/room_"+room.id+".map";
      },
      isButtonDisabled: function(room){
        return !(room.controller.connection && room.controller.configuration);
      },
      saveConnectionSettings: function(room){
        this.connectionNotification="Nastavitve uspešno shranjene!"
        $("#modal-connect-notification").attr("class","bg-success");
        $("#modal-connect-notification").show();
        setTimeout(function(){
          $("#modal-connect-notification").hide();
        },3000)
      },
      saveConfiguration: function(room){
        for(var i=0; i<room.lights.length; i++){
          console.log(room.lights[i].gpioPin+" ");
        }
      },
      removeRoom: function(room){
        remove(this.rooms,room);
      },
      drawRoomMapOnCanvas: function(room){
        var svg=$('#tloris'+room.id);

        var buttonAddLight=$("#addLight"+room.id);
        var buttonSelectLight=$("#selectLight"+room.id);
        buttonAddLight.attr("disabled", false);
        buttonSelectLight.attr("disabled", false);

        var imageObj = new Image();
        imageObj.src = this.roomMapPath(room);

        var sirinaSlike= 550;
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
          room.lights[i].status=false;
          svg.append(novaLuc);
        }


      },
      addLight:function(room){
        $('#tloris' + room.id).off("click");

        var svg=$('#tloris'+room.id);
        var svgAlt=document.getElementById('tloris' + room.id);

        var buttonAddLight=$("#addLight"+room.id);
        var buttonSelectLight=$("#selectLight"+room.id);
        buttonAddLight.attr("disabled", true);
        buttonSelectLight.attr("disabled", false);

        var sirinaSlike= 40;
        var visinaSlike= 40;

        svg.click(function(e){

            var pos = getMousePos(svgAlt, e);
            var x = pos.x;
            var y = pos.y;

            var newLight= {
              offsetX:x/svg.width(),
              offsetY:y/svg.height(),
              objectPointer:null,
              selected:false,
              gpioPin:-1,
              status:false
            };
            room.lights.push(newLight);

            console.log("newLight=",newLight.offsetX,"y=",newLight.offsetY);
            console.log("Tabela luči",room.lights)
            var x=newLight.offsetX*svg.width()-sirinaSlike/2;
            var y=newLight.offsetY*svg.height()-visinaSlike/2;
            var novaLuc=createImageElement(sirinaSlike, visinaSlike, "images/light_OFF.jpg", x, y);
            newLight.objectPointer=novaLuc; // assing each light object pointer for easy manage
            svg.append(novaLuc);

        });

      },
      removeLight:function(room,lightID){

        var svg=$('#tloris'+room.id);
        svg.off("click");

        var svgAlt=document.getElementById('tloris' + room.id);

        var buttonAddLight=$("#addLight"+room.id);
        var buttonSelectLight=$("#selectLight"+room.id);
        buttonAddLight.attr("disabled", false);
        buttonSelectLight.attr("disabled", false);

        svg.click(function(e){

            var pos = getMousePos(svgAlt, e);
            var x = pos.x;
            var y = pos.y;


        });

        objectToRemove=room.lights[lightID].objectPointer;
        objectToRemove.remove();
        removeByIndex(room.lights, lightID)
      },
      selectLight: function(room){
        var svg=$('#tloris'+room.id);
        svg.off("click");

        var svgAlt=document.getElementById('tloris' + room.id);

        var buttonAddLight=$("#addLight"+room.id);
        var buttonSelectLight=$("#selectLight"+room.id);
        buttonAddLight.attr("disabled", false);
        buttonSelectLight.attr("disabled", true);



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

  var modalAddRoom = new Vue({
    el: '#modal-addRoom',
    data: {},
    methods: {
      addRoom: function(){
        $.ajax({
            url:'/addRoom',
            type:'post',
            contentType: 'application/json',
            async: true,
            data: JSON.stringify({
              roomName: $("#modal-addRoom-roomName").val(),
              roomDescription: $("#modal-addRoom-roomDescription").val()
            }),

            success:function(){
                console.log("Zahtevek za dodajanje sobe uspešno poslan!")
            },
            error: function(e){
              console.log(e);
            }
        });
      }
    }

  });

});

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function remove(arr, item) {
    for(var i = arr.length; i--;) {
        if(arr[i] === item) {
            arr.splice(i, 1);
        }
    }
}

function removeByIndex(arr, index) {
    for(var i = arr.length; i--;) {
        if(index === i) {
            arr.splice(i, 1);
        }
    }
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
