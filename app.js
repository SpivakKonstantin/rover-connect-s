var debug = false;

var express = require('express'),
  http = require('http'),
  path = require('path'),
  async = require('async');

if(debug === false){
    var gpio = require('pi-gpio');
}

  var Pca9685Driver = require("pca9685").Pca9685Driver,
  app = express();

//set the port
app.set('port', process.env.PORT || 3000);

//serve static files from /static directory
app.use(express.static(path.join(__dirname, '/static')));

//create the server
var http = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//init socket.io
var io = require('socket.io')(http);

var fpsVar = +new Date;
var yCameraDefault = 1600;
var xCameraDefault = 1470;
var tank = {

  //assign pin numbers to variables for later use
  // motors: {
  //   leftFront: 11,
  //   leftBack: 12,
  //   rightFront: 15,
  //   rightBack: 16
  // },

  init: function(){
      if(debug === false){
          var i2cBus = require("i2c-bus");
          pwm = new Pca9685Driver({
              i2c: i2cBus.openSync(1),
              address: 0x40,
              frequency: 50,
              debug: false
          }, function() {
              console.log("Initialization done");
              pwm.setPulseLength(3, xCameraDefault);
              pwm.setPulseLength(4, yCameraDefault);
          });
      }else {
          pwm = {
              setPulseLength: function(a,b){
                  if(a === 5){
                      console.log(fpsVar - (+new Date) + "param:" + b);
                      fpsVar = +new Date;
                  }

              }
          };
      }

  },

  //for moving forward we power both motors  
  moveForward: function(left, right){
      if(left != 'undefined'){
          forvardTmpL = parseInt(left);
          forvardTmpR = parseInt(right);
      }else {
          forvardTmpL = 1700;
          forvardTmpR = 1700;
      }

    async.parallel([
      pwm.setPulseLength(5, forvardTmpL),
      pwm.setPulseLength(6, forvardTmpR),
    ]);
  },

  //for moving backward we power both motors but in backward mode
  moveBackward: function(){
    async.parallel([
      //console.log('back'),
      pwm.setPulseLength(5, 1300),
      pwm.setPulseLength(6, 1300)
    ]);
  },

  //for turning right we power the left motor 
  moveLeft: function(){
    async.parallel([
      //console.log('left'),
        pwm.setPulseLength(5, 1300),
        pwm.setPulseLength(6, 1700),
    ]);
  },

  //for turning left we power the right motor
  moveRight: function(){
    async.parallel([
      //console.log('right'),
        pwm.setPulseLength(5, 1700),
        pwm.setPulseLength(6, 1300),
    ]);
  },
    moveCameraUp: function(){
    async.parallel([

      pwm.setPulseLength(4, 1000),
    ]);
  },
    moveCameraLeft: function(){
    async.parallel([
      pwm.setPulseLength(3, 2000),
    ]);
  },
    moveCameraRight: function(){
    async.parallel([
      pwm.setPulseLength(3, 900),
    ]);
  },
    moveCameraDef: function(){
    async.parallel([
      pwm.setPulseLength(3, xCameraDefault),
      pwm.setPulseLength(4, yCameraDefault),
    ]);
  },

  //stop both motors in all directions 
  stop: function(){

    async.parallel([
      console.log('stop'),
      pwm.setPulseLength(5, 1500),
      pwm.setPulseLength(6, 1500),
    ]);
  }
};
var previosDirection = null;
//listen for socket connection
io.sockets.on('connection', function(socket) {
  //listen for move signal
    console.log(io.sockets.sockets.length)
    socket.on('gamepad', function(direction) {

        if(direction.type == 'up'){
            //console.log('type: ' + direction.axis);
            tank.moveForward(direction.left, direction.right);
            previosDirection = 'up';
        }
        if(direction.type == 'down'){
            tank.moveForward(direction.left, direction.right);
            previosDirection = 'down';
        }
        if(direction.type == 'left'){
            tank.moveLeft();
            previosDirection = 'left';
        }
        if(direction.type == 'right'){
            tank.moveRight();
            previosDirection = 'right';
        }

        if(direction.type == 'cameraUp'){
            tank.moveCameraUp();
        }
        if(direction.type == 'cameraLeft'){
            tank.moveCameraLeft();
        }
        if(direction.type == 'cameraRight'){
            tank.moveCameraRight();
        }
        if(direction.type == 'cameraDef'){
            tank.moveCameraDef();
        }
    })


  socket.on('move', function(direction) {

    switch(previosDirection){
      case 'up':
        tank.moveBackward();
        break;
    }


    switch(direction){
     case 'up':
        tank.moveForward();
        break;
      case 'down':
        tank.moveBackward();
        break;
      case 'right':
        tank.moveLeft();
        break;
      case 'left':
        tank.moveRight();
        break;
    }
     previosDirection = direction;
  });

    socket.on('disconnect', function(){
        tank.stop();
        pwm.setPulseLength(3, xCameraDefault);
        pwm.setPulseLength(4, yCameraDefault);
        console.log('disconect');
    });
  //listen for stop signal
  socket.on('stop', function(dir){
    console.log('previos: '+previosDirection)
    if(previosDirection == 'up'){
      setTimeout(function () {
        tank.moveBackward()
      }, 50);
      setTimeout(function () {
        tank.stop()
      }, 100);
    }else {
      tank.stop();
    }

    if(previosDirection == 'left'){
      setTimeout(function () {
        pwm.setPulseLength(6, 1300);
      }, 50);
      setTimeout(function () {
        tank.stop()
      }, 100);
    }else {
      tank.stop();
    }



    if(previosDirection == 'right'){
      setTimeout(function () {
        pwm.setPulseLength(5, 1300);
      }, 50);
      setTimeout(function () {
        tank.stop()
      }, 100);
    }else {
      tank.stop();
    }


  });
});
/**
 * логика если заднее колесо было назад, то переключать ненадо. если вперед то переключить. вся логика, и
 * в таком ключе всегда ровер будет готов поехать назад
 */

tank.init();
