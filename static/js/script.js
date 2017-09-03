$(function () {

  /***gamepad***/
  var haveEvents = 'ongamepadconnected' in window;
    var controllers = {};

    function connecthandler(e) {
        addgamepad(e.gamepad);
    }

    function addgamepad(gamepad) {
        controllers[gamepad.index] = gamepad;

        var d = document.createElement("div");
        d.setAttribute("id", "controller" + gamepad.index);

        var t = document.createElement("h1");
        t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
        d.appendChild(t);

        var b = document.createElement("div");
        b.className = "buttons";
        for (var i = 0; i < gamepad.buttons.length; i++) {
            var e = document.createElement("span");
            e.className = "button";
            //e.id = "b" + i;
            e.innerHTML = i;
            b.appendChild(e);
        }

        d.appendChild(b);

        var a = document.createElement("div");
        a.className = "axes";

        for (var i = 0; i < gamepad.axes.length; i++) {
            var p = document.createElement("input");
            p.className = "axis";
            //p.id = "a" + i;
            p.setAttribute("max", "2");
            p.setAttribute("value", "1");
            p.innerHTML = i;
            a.appendChild(p);
        }

        d.appendChild(a);

        // See https://github.com/luser/gamepadtest/blob/master/index.html
        var start = document.getElementById("start");
        if (start) {
            start.style.display = "none";
        }

        document.body.appendChild(d);
        requestAnimationFrame(updateStatus);
    }

    function disconnecthandler(e) {
        removegamepad(e.gamepad);
    }

    function removegamepad(gamepad) {
        var d = document.getElementById("controller" + gamepad.index);
        document.body.removeChild(d);
        delete controllers[gamepad.index];
    }
    flag = false;
    var prev = 'stop';
    cam = -1.29
    function updateStatus() {
        if (!haveEvents) {
            scangamepads();
        }

        var i = 0;
        var j;
        var center = 1500;
        var maxUp = 300;
        var maxDown = 200;

        for (j in controllers) {
            var controller = controllers[j];
            var d = document.getElementById("controller" + j);
            var buttons = d.getElementsByClassName("button");

            for (i = 0; i < controller.buttons.length; i++) {
                var b = buttons[i];
                var val = controller.buttons[i];
                var pressed = val == 1.0;
                if (typeof(val) == "object") {
                    pressed = val.pressed;
                    val = val.value;

                }

                var pct = Math.round(val * 100) + "%";
                b.style.backgroundSize = pct + " " + pct;

                if (pressed) {
                    b.className = "button pressed";
                    console.log('button: ' + i)

                } else {
                    b.className = "button";
                }
            }

            var axes = d.getElementsByClassName("axis");

            for (i = 0; i < controller.axes.length; i++) {

                var a = axes[i];
                a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
                a.setAttribute("value", controller.axes[i] + 1);

                if(cam != controller.axes[9].toFixed(2)){
                    cam = controller.axes[9].toFixed(2);
                    if(cam.toString() === '-1.29'){

                        emit('gamepad', {type: 'cameraDef'});
                    }else if(cam.toString() == '-1.00'){

                        emit('gamepad', {type: 'cameraUp'});
                    }else if(cam.toString() === '0.71'){
                        emit('gamepad', {type: 'cameraLeft'});
                    }else if(cam.toString() === '-0.43'){
                        emit('gamepad', {type: 'cameraRight'});
                    }

                }


                if(controller.axes[5] > -0.7 && controller.axes[5] < 0.7){
                    if(i == 0 || i == 1){



                        leftRight = controller.axes[0];


                        if(i==1){
                            if(controller.axes[i] < 0.2){
                                //up
                                //console.log(leftRight);
                                tmp = 0 - (controller.axes[i]);


                                clearUp = (maxUp*tmp.toFixed(2))+center;

                                if(leftRight > -0.2 && leftRight < 0.2){
                                    //stop

                                    if(clearUp <= 1550 && flag === true ){
                                        emit('stop', {});
                                        flag = false;
                                    }else if(clearUp >= 1551) {
                                        emit('gamepad', {type: 'up', left: clearUp, right: clearUp});
                                        flag = true;
                                    }


                                }else if(leftRight < -0.2){
                                    emit('gamepad', {type: 'up', left: (clearUp - ((clearUp - center-100)*(0 - leftRight.toFixed(2)))).toFixed(0), right: clearUp});
                                    flag = true;
                                }else if(leftRight > 0.2){
                                    emit('gamepad', {type: 'up', left: clearUp, right: (clearUp - ((clearUp - center-100)*(leftRight.toFixed(2)))).toFixed(0)});
                                    flag = true;
                                }

                                prev = 'up';
                            }else if(controller.axes[i] >= 0.2) {
                                tmp =  (controller.axes[i]);
                                clearUp = center - (maxDown*tmp.toFixed(2));
                                emit('gamepad', {type: 'down', left: clearUp, right: clearUp});
                                flag = true;
                                prev = 'down';
                            }
                        }

                    }
                }else if(controller.axes[5] < -0.7){
                    if(prev != 'left'){
                        console.log(prev);
                        emit('gamepad', {type: 'left'});
                        flag = true;
                        prev = 'left';
                    }

                }else if(controller.axes[5] > 0.7){
                    if(prev !='right') {
                        emit('gamepad', {type: 'right'});
                        flag = true;
                        prev = 'right';
                    }
                }


            }
        }

        requestAnimationFrame(updateStatus);
    }

    function scangamepads() {
        var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        for (var i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                if (gamepads[i].index in controllers) {
                    controllers[gamepads[i].index] = gamepads[i];
                } else {
                    addgamepad(gamepads[i]);
                }
            }
        }
    }


    window.addEventListener("gamepadconnected", connecthandler);
    window.addEventListener("gamepaddisconnected", disconnecthandler);

    if (!haveEvents) {
        setInterval(scangamepads, 500);
    }
    /****gamepad end****/



  function emit(ev, obj){
    console.log(ev)
    console.log(obj)
         socket.emit(ev, obj);
    }

  var socket = io.connect();
    ui = {
      up: $('.btn-up'),
      left: $('.btn-left'),
      down: $('.btn-down'),
      right: $('.btn-right'),
      all: $('.btn')
    },
    activeClass = 'is-active',
    isPressed = false;


  // $(document).keydown(function(e){
  //   //don't do anything if there's already a key pressed
  //   if(isPressed) return;
  //
  //   isPressed = true;
  //   switch(e.which){
  //     case 87:
  //       socket.emit('move', 'up');
  //       ui.up.addClass(activeClass);
  //       break;
  //     case 65:
  //       socket.emit('move', 'left');
  //       ui.left.addClass(activeClass);
  //       break;
  //     case 83:
  //       socket.emit('move', 'down');
  //       ui.down.addClass(activeClass);
  //       break;
  //     case 68:
  //       socket.emit('move', 'right');
  //       ui.right.addClass(activeClass);
  //       break;
  //   }
  // });
  
  //stop all motors when any key is released
  $(document).keyup(function(e){
    ui.all.removeClass(activeClass);
    socket.emit('stop');
    isPressed = false;
  });
});

