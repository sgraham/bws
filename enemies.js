var clock = new THREE.Clock();
var enemies = [];
var enemyStartHeight = 2000;

function Enemy(loc)
{
    this.vel = new THREE.Vector3();
    this.impulse = new THREE.Vector3();
    this.maxvel = 0;
    this.accel = new THREE.Vector3();
    if (this.constructor != Enemy)
        enemies.push(this);
    this.spawnTime = clock.getElapsedTime();
}

Enemy.init = function()
{
    Dopey.init();
    Spinner.init();
    BlackHole.init();
}

Enemy.prototype = {

constructor: Enemy,

spawn: function(target) {
    var tween = new TWEEN.Tween(this.mesh.position).to(target, 2000).easing(TWEEN.Easing.Bounce.EaseOut);
    tween.start();
},

};

// -------------------------------------------------

function Dopey(startLoc)
{
    Enemy.call(this);
    this.mesh = addObjectColor(Dopey.geom, 0x00ff00, startLoc.x, enemyStartHeight, startLoc.z);
    this.mesh.receiveShadow = false;
    this.spawn(startLoc);
    this.radius = 60;
    this.hitpoints = 7;
    this.scorePoints = 100;
    this.maxvel = 400;
    this.oscillate = 0;
}

Dopey.prototype = new Enemy();
Dopey.prototype.constructor = Dopey;

Dopey.tmp1 = new THREE.Vector3();
Dopey.prototype.update = function(delta)
{
    Dopey.tmp1.sub(ship.position, this.mesh.position);

    this.oscillate += delta * 5;
    this.mesh.rotation.y = Math.atan2(Dopey.tmp1.x, Dopey.tmp1.z) + Math.PI/2 + Math.sin(this.oscillate) * Math.PI/6;

    Dopey.tmp1.setLength(7000);
    this.accel.copy(Dopey.tmp1);
};

Dopey.init = function()
{
    Dopey.geom = new THREE.CubeGeometry(30, 30, 120);
};


// -------------------------------------------------

function Spinner(startLoc)
{
    Enemy.call(this);
    var mtop = addObjectColor(Spinner.geomTop, 0x008080, 45, 0, 0);
    mtop.receiveShadow = false;
    var mright = addObjectColor(Spinner.geomRight, 0x008080, 0, 0, 45);
    mright.receiveShadow = false;
    this.mesh = addObjectColor(Spinner.geomCentre, 0x008080, startLoc.x, enemyStartHeight, startLoc.z);

    this.mesh.add(mtop);
    this.mesh.add(mright);

    this.spawn(startLoc);
    this.radius = 60;
    this.hitpoints = 18;
    this.scorePoints = 250;
    this.maxvel = 600;
}

Spinner.prototype = new Enemy();
Spinner.prototype.constructor = Spinner;

Spinner.tmp1 = new THREE.Vector3();
Spinner.offsetMat = new THREE.Matrix4();
Spinner.prototype.update = function(delta)
{
    this.mesh.rotation.y += 15 * delta;
    Spinner.tmp1.sub(ship.position, this.mesh.position);
    var len = Spinner.tmp1.length();
    if (len > 250)
        Spinner.offsetMat.multiplyVector3(Spinner.tmp1);
    Spinner.tmp1.multiplyScalar(9000/len);
    this.accel.copy(Spinner.tmp1);
};

Spinner.init = function()
{
    Spinner.geomTop = new THREE.CubeGeometry(30, 30, 120);
    Spinner.geomRight = new THREE.CubeGeometry(120, 30, 30);
    Spinner.geomCentre = new THREE.CubeGeometry(20, 30, 20);
    Spinner.offsetMat.makeRotationY(Math.PI/5);
}

// -------------------------------------------------

function BlackHole(startLoc)
{
    Enemy.call(this);
    this.mesh = addObjectColor(BlackHole.geom, 0x000000, startLoc.x, enemyStartHeight, startLoc.z);
    this.mesh.receiveShadow = false;
    this.spawn(startLoc);
    this.radius = 30;
    this.hitpoints = 50;
    this.scorePoints = 500;
    this.maxvel = 100;
    this.period = 0;
}

BlackHole.prototype = new Enemy();
BlackHole.prototype.constructor = BlackHole;

BlackHole.tmp1 = new THREE.Vector3();
BlackHole.prototype.update = function(delta)
{
    this.mesh.rotation.x += 5 * delta;
    this.mesh.rotation.y += 15 * delta;
    this.mesh.rotation.z += 10 * delta;

    // suck towards
    BlackHole.tmp1.sub(this.mesh.position, ship.position);
    BlackHole.tmp1.setLength(300);
    shipSuck.addSelf(BlackHole.tmp1);

    // move towards
    BlackHole.tmp1.sub(ship.position, this.mesh.position);
    BlackHole.tmp1.setLength(500);
    this.accel.copy(BlackHole.tmp1);

    //this.period += delta * 5;
    //this.mesh.position.y = Math.sin(this.period) * 100 + 115;
}
0
BlackHole.init = function()
{
    //BlackHole.geom = new THREE.CubeGeometry(60, 60, 60);
    BlackHole.geom = new THREE.TorusGeometry(30, 22, 10, 10);
}
