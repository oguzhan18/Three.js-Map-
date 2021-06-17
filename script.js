(function(k){
  k.keys = {
    'backspace':  8,  'pause'    :  19, '7'        :  55, 'd'        :  68,
    'tab'      :  9,  'caps'     :  20, '8'        :  59, 'e'        :  69,
    'enter'    :  13, 'esc'      :  27, '9'        :  60, 'f'        :  70,
    'shift'    :  16, 'pageUp'   :  33, 'a'        :  65, 'g'        :  71,
    'ctrl'     :  17, 'pageDown' :  34, 'h'        :  72, 'n'        :  78,
    'alt'      :  18, 'end'      :  35, 'i'        :  73, 'o'        :  79,
    'home'     :  36, 'delete'   :  46, 'j'        :  74, 'p'        :  80,
    'left'     :  37, '0'        :  48, 'k'        :  75, 'q'        :  81,
    'up'       :  38, '1'        :  49, 'l'        :  76, 'r'        :  82,
    'right'    :  39, '2'        :  50, 'm'        :  77, 's'        :  83,
    'down'     :  40, '3'        :  51, 't'        :  84, 'z'        :  90,
    'insert'   :  45, '4'        :  52, 'u'        :  85, 'winLeft'  :  91,
    '5'        :  53, 'b'        :  66, 'v'        :  86, 'winRight' :  92,
    '6'        :  54, 'c'        :  67, 'w'        :  87, 'select'   :  93,
    'x'        :  88, 'num0'     :  96, 'num7'     : 103, 'decimal'  : 110,
    'y'        :  89, 'num1'     :  97, 'divide'   : 111, 'f6'       : 117,
    'num2'     :  98, 'num8'     : 104, 'f1'       : 112, 'f7'       : 118,
    'num3'     :  99, 'num9'     : 105, 'f2'       : 113, 'f8'       : 119,
    'num4'     : 100, 'multiply' : 106, 'f3'       : 114, 'f9'       : 120,
    'num5'     : 101, 'add'      : 107, 'f4'       : 115, 'f10'      : 121,
    'num6'     : 102, 'subtract' : 109, 'f5'       : 116, 'f11'      : 122,
    'f12'      : 123, '-'        : 189, ';'        : 186, '`'        : 192,
    'numLock'  : 144, '.'        : 190, '='        : 187, '['        : 219,
    'scrlLock' : 145, '/'        : 191, ','        : 188, '\\'       : 220,
    ']'        : 221, '\''       : 222
  };
  
  k._pressed = [];

  window.onkeydown = function(e){
    k._pressed[e.keyCode] = true;
  };
  
  window.onkeyup = function(e){
    k._pressed[e.keyCode] = false;
  };
  
  k.isKeyPressed = function(key){
    return this._pressed[this.keys[key]];
  };
})(window.keyboard || (window.keyboard = {}));

function Tank(options){
  this.leftTrack = 0;
  this.rightTrack = 0;
  this.sideThrust = 0;
  this.direction = 0;
  this.topSpeed = 20;
  this.acceleration = 1.0;
  this.drift = 0.0;
  this.position = {x: 0, y: 0, z: 0};
  this.size = {w: 0, h: 0, d: 0}
  this.mesh = undefined;
  
  for (var prop in options)
    if (this.hasOwnProperty(prop))
      this[prop] = options[prop];
  
  if (this.mesh !== undefined && this.mesh.lookAt === undefined)
    this.mesh.lookAt = function(a){};
  
  this.__lookVec = new THREE.Vector3(0, 0, 0);
}

Tank.prototype = {
  update: function(time, left, right, sideways){
    this.leftTrack += left * this.acceleration;
    this.rightTrack += right * this.acceleration;
    this.sideThrust += sideways * this.acceleration;
    
    var driftDiff = 1.0 - this.drift;
    
    if (left == 0.0){
      if (Math.abs(this.leftTrack) - driftDiff < 0)
        this.leftTrack = 0.0;
      else
        this.leftTrack -= Math.sign(this.leftTrack) * driftDiff;
    }
    if (right == 0.0){
      if (Math.abs(this.rightTrack) - driftDiff < 0)
        this.rightTrack = 0.0;
      else
      this.rightTrack -= Math.sign(this.rightTrack) * driftDiff;
    }
    if (sideways == 0.0){
      if (Math.abs(this.sideThrust) - driftDiff < 0)
        this.sideThrust = 0.0;
      else
      this.sideThrust -= Math.sign(this.sideThrust) * driftDiff;
    }
    
    this.leftTrack = Math.min(1.0, Math.max(-1.0, this.leftTrack));
    this.rightTrack = Math.min(1.0, Math.max(-1.0, this.rightTrack));
    this.sideThrust = Math.min(1.0, Math.max(-1.0, this.sideThrust));
    
    var angleChange = (this.leftTrack - this.rightTrack) / this.size.w;
    var speed = (this.leftTrack + this.rightTrack) * this.topSpeed * 0.5;
    
    this.direction += angleChange * time * this.topSpeed * 0.5;
    this.direction > (2 * Math.PI) ? this.direction -= (2 * Math.PI) : false;
    
    var cosDir = Math.cos(this.direction);
    var sinDir = Math.sin(this.direction);
    
    this.position.x += (cosDir * speed - sinDir * this.topSpeed * this.sideThrust) * time;
    this.position.z += (sinDir * speed + cosDir * this.topSpeed * this.sideThrust) * time;
    
    this.__lookVec.x = this.position.x + (10 * cosDir);
    this.__lookVec.z = this.position.z + (10 * sinDir);
    
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = this.position.z;
    this.mesh.position.y = this.position.y;
    this.mesh.lookAt(this.__lookVec);
  }
};

var scene, renderer, camera, player, camera2;

function Init(){
  scene = new THREE.Scene();
  
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  camera2 = new THREE.OrthographicCamera(-50, 50, 50, -50, 0.1, 1000);
  camera2.position.y = 100;
  camera2.lookAt(new THREE.Vector3(0,0,0));
  
  window.onresize = function(e){
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  var lights = [];
  lights[0] = new THREE.DirectionalLight(0xffffff, 1.0);
  lights[1] = new THREE.AmbientLight(0x403440);
  lights[0].position.set(10, 15, 3);
  scene.add(lights[0]);
  scene.add(lights[1]);
  player = {
    tank: new Tank({
      topSpeed: 20,
      acceleration: 0.07,
      drift: 0.95,
      mesh: new THREE.Object3D(),
      size:{
        w: 5,
        h: 2,
        d: 8
      }
    })
  };
  
  player.tank.mesh.lookAt(new THREE.Vector3(0, 0, 10));
  
  
  player.tank.mesh.add(camera);
  camera.position.set(0, 4, -10);
  camera.lookAt(new THREE.Vector3(0, 4, 10));
  
  var material = new THREE.MeshLambertMaterial({color: 0xff0000});
  var _tank = new THREE.Object3D();
  
  var body = new THREE.Mesh(
    new THREE.BoxGeometry(5, 1, 8),
    material
  );
  
  var treads = [];
  for (var i = 0; i < 4; i++){
    treads[i] = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 1, 3),
      material
    );
  }
  
  _tank.add(body);
  for (var i = 0; i < 4; i++)
    _tank.add(treads[i]);
  
  treads[0].position.set(-2.5, 0.5,  4);
  treads[1].position.set( 2.5, 0.5,  4);
  treads[2].position.set(-2.5, 0.5, -4);
  treads[3].position.set( 2.5, 0.5, -4);
  
  body.position.set(0, 1, 0);
  
  player.tank.mesh.add(_tank);
  scene.add(player.tank.mesh);
  
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 50, 50),
    new THREE.MeshLambertMaterial({color: 0x008844})
  );
  
  floor.position.set(0, -0.01, 0);
  floor.lookAt(new THREE.Vector3(0, 1, 0));
  scene.add(floor);
  scene.add(new THREE.GridHelper(50, 2));
}

var lastT = 0;
var vec = new THREE.Vector3(0, 0, 0);
function Update(t){
  var delta = (t - lastT) / 1000;
  lastT = t;
  
  var left, right, h;
  left = 0;
  right = 0;
  h = 0;
  
  left += (keyboard.isKeyPressed('w') ? 1 : 0);
  left += (keyboard.isKeyPressed('s') ? -1 : 0);
  
  right += (keyboard.isKeyPressed('up') ? 1 : 0);
  right += (keyboard.isKeyPressed('down') ? -1 : 0);
  
  h += (keyboard.isKeyPressed('left') ? -0.35 : 0);
  h += (keyboard.isKeyPressed('right') ? 0.35 : 0);
  h += (keyboard.isKeyPressed('a') ? -0.35 : 0);
  h += (keyboard.isKeyPressed('d') ? 0.35 : 0);
  
  player.tank.update(delta, left, right, h);
  
  var width = window.innerWidth;
  var height = window.innerHeight;
  
  renderer.setViewport(0, 0, width, height);
  renderer.enableScissorTest(false);
  renderer.render(scene, camera);
  
  renderer.setViewport(0, height - (width * 0.125), width * 0.125, width * 0.125);
  renderer.setScissor(0, height - (width * 0.125), width * 0.125, width * 0.125);
  renderer.enableScissorTest(true);
  renderer.render(scene, camera2);
  
  requestAnimationFrame(Update);
}

Init();
Update(0);