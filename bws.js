if (!Detector.webgl) Detector.addGetWebGLMessage();

var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var FAR = 10000;
var container;
var ZERO3 = new THREE.Vector3(0,0,0);

var camera, scene, renderer;

var mesh, geometry;

var sunLight, pointLight, ambientLight;

var composer, effectFXAA, hblur, vblur;

var parameters;

var clock = new THREE.Clock();

var BULLET_RADIUS = 9;

var explodeIndex = 0;
var scale = 800;
var scale2 = scale/2;

var bulletIndex = 0;
var fireCountDown = 0;
var titleShootCounter = 0;

var curScore = 0;
var highScore = 0;
var textFaceMaterial = new THREE.MeshFaceMaterial();
textMaterialFront = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
textMaterialSide = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.SmoothShading } );

var mode = 'TITLE';

var numScoreDigits = 6;
var numberPixelWidth = 48;
var numberTexWidth = 512;
var scoreSprites = [];

var enemies = [];
var enemyStartHeight = 2000;

function mozconnecthandler(e)
{
    navigator.webkitGamepads = [e.gamepad];
}

function setUpScore()
{
    var textureNumbers = THREE.ImageUtils.loadTexture("numbers.png");
    for (var i = 0; i < numScoreDigits; ++i)
    {
        var sprite = new THREE.Sprite({
            map: textureNumbers,
            useScreenCoordinates: true,
            affectedByDistance: false,
            scaleByViewport: true,
            alignment: THREE.SpriteAlignment.bottomRight
        });
        sprite.uvOffset.x = 0;
        sprite.uvScale.x = numberPixelWidth/numberTexWidth;
        scene.add(sprite);
        scoreSprites.push(sprite);
    }
    updateScoreScreenLocation();
}

function updateScoreScreenLocation()
{
    for (var i = 0; i < numScoreDigits; ++i)
    {
        var sprite = scoreSprites[i];
        var screenScale = .12;
        sprite.scale.x = screenScale * SCREEN_HEIGHT/SCREEN_WIDTH;;
        sprite.scale.y = screenScale;
        sprite.position.x = SCREEN_WIDTH - (numScoreDigits - i - 1) * numberPixelWidth - 10;
        sprite.position.y = SCREEN_HEIGHT - 10;
    }
}

function updateScores()
{
    var scoreStr = "" + curScore;
    while (scoreStr.length < numScoreDigits) scoreStr = "0" + scoreStr;
    for (var i = 0; i < numScoreDigits; ++i)
    {
        var sprite = scoreSprites[i];
        var num  = scoreStr[i] - '0';
        sprite.uvOffset.x = num * numberPixelWidth / numberTexWidth;
    }
}


function explode(at, num)
{
    num = num || 2;
    for (var i = 0; i < num; ++i)
    {
        var obj = explodeBricks[explodeIndex];
        var vel = explodeVels[explodeIndex];
        if (++explodeIndex >= explodeBricks.length)
            explodeIndex = 0;
        obj.position.copy(at);
        vel.x = Math.random() * scale - scale2;
        vel.y = Math.random() * scale*1.5 - scale2*1.5;
        vel.z = Math.random() * scale - scale2;
    }
}

function addObject( geometry, material, x, y, z, ry )
{
    ry = ry || 0;
    var tmpMesh = new THREE.Mesh( geometry, material );

    THREE.ColorUtils.adjustHSV( tmpMesh.material.color, 0.1, -0.1, 0 );

    tmpMesh.position.set( x, y, z );

    tmpMesh.rotation.y = ry;

    tmpMesh.castShadow = true;
    tmpMesh.receiveShadow = true;

    scene.add( tmpMesh );

    return tmpMesh;
}

function addObjectColor( geometry, color, x, y, z, ry )
{
    var material = new THREE.MeshPhongMaterial( { color: color, ambient: 0x444444 } );
    //var material = new THREE.MeshPhongMaterial( { color: color, ambient: color } );
    //THREE.ColorUtils.adjustHSV( material.ambient, 0, 0, -0.5 );

    return addObject( geometry, material, x, y, z, ry );
}

function Enemy(loc)
{
}

Enemy.prototype = {

constructor: Enemy,

spawn: function(target) {
    var tween = new TWEEN.Tween(this.mesh.position).to(target, 2000).easing(TWEEN.Easing.Bounce.EaseOut);
    tween.start();
},

};

function Dopey(startLoc)
{
    Enemy.call(this);
    this.mesh = addObject(Dopey.geom, Dopey.mat, startLoc.x, enemyStartHeight, startLoc.z);
    this.mesh.receiveShadow = false;
    this.spawn(startLoc);
    this.radius = 60;
    this.hitpoints = 8;
    this.scorePoints = 100;
    enemies.push(this);
}

Dopey.prototype = new Enemy();
Dopey.prototype.constructor = Dopey;

Dopey.tmp1 = new THREE.Vector3();
Dopey.prototype.update = function(delta)
{
    this.mesh.rotation.y += 15 * delta;

    Dopey.tmp1.sub(ship.position, this.mesh.position);
    Dopey.tmp1.y = 0;
    Dopey.tmp1.normalize();
    Dopey.tmp1.multiplyScalar(delta * 200);
    this.mesh.position.addSelf(Dopey.tmp1);
};

Dopey.init = function()
{
    Dopey.geom = new THREE.CubeGeometry(30, 30, 120);
    Dopey.mat = new THREE.MeshPhongMaterial( { shininess: 10, ambient: 0x00ff00, color: 0x00ff00 } );
};


function Spinner(startLoc)
{
    Enemy.call(this);
    var mtop = addObject(Spinner.geomTop, Spinner.mat, 45, 0, 0);
    mtop.receiveShadow = false;
    var mright = addObject(Spinner.geomRight, Spinner.mat, 0, 0, 45);
    mright.receiveShadow = false;
    this.mesh = addObject(Spinner.geomCentre, Spinner.mat, startLoc.x, enemyStartHeight, startLoc.z);

    this.mesh.add(mtop);
    this.mesh.add(mright);

    this.spawn(startLoc);
    this.radius = 60;
    this.hitpoints = 20;
    this.scorePoints = 250;
    enemies.push(this);
}

Spinner.prototype = new Enemy();
Spinner.prototype.constructor = Spinner;

Spinner.tmp1 = new THREE.Vector3();
Spinner.prototype.update = function(delta)
{
    this.mesh.rotation.y += 5 * delta;
};

Spinner.init = function()
{
    Spinner.geomTop = new THREE.CubeGeometry(30, 30, 120);
    Spinner.geomRight = new THREE.CubeGeometry(120, 30, 30);
    Spinner.geomCentre = new THREE.CubeGeometry(20, 30, 20);
    Spinner.mat = new THREE.MeshPhongMaterial( { shininess: 200, ambient: 0x0000ff, color: 0x0000ff });
}


function init()
{
    window.addEventListener("MozGamepadConnected", mozconnecthandler);

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, SCREEN_WIDTH / SCREEN_HEIGHT, 2, FAR );

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog( 0x00aaff, 1000, FAR );
    scene.fog.color.setHSV( 0.13, 0.25, 0.1 );

    setUpScore();

    // TEXTURES

    var textureSquares = THREE.ImageUtils.loadTexture("bright_squares256.png");
    textureSquares.wrapS = textureSquares.wrapT = THREE.RepeatWrapping;
    textureSquares.magFilter = THREE.NearestFilter;
    textureSquares.repeat.set( 50, 50 );

    // GROUND

    var groundMaterial = new THREE.MeshPhongMaterial( { shininess: 80, ambient: 0x444444, color: 0xffffff, specular: 0xffffff, map: textureSquares } );

    var planeGeometry = new THREE.PlaneGeometry( 100, 100 );

    var ground = new THREE.Mesh( planeGeometry, groundMaterial );
    ground.position.set( 0, 0, 0 );
    ground.rotation.x = -Math.PI/2;
    ground.scale.set( 1000, 1000, 1000 );

    ground.receiveShadow = true;

    scene.add( ground );

    var wallGeom = new THREE.CubeGeometry( 25, 70, 5 );
    var wallMat = new THREE.MeshPhongMaterial( { shininess: 80, ambient: 0x88aa88, color: 0xffffff, specular: 0xffffff, map: textureSquares } );
    walls = [];
    var count = 0;
    for (var i = 0; i < 2*Math.PI; i += Math.PI / 16)
    {
        var wall = new THREE.Mesh(wallGeom, wallMat);
        walls[count++] = wall;
        wall.position.set(1000*Math.sin(i), 0, 1000*Math.cos(i));
        wall.scale.set(5, 3, 5);
        wall.rotation.y = i;
        wall.receiveShadow = true;
        wall.castShadow = true;
        scene.add(wall);
    }

    explodeBricks = [];
    explodeVels = [];
    //var tinyCube = THREE.CubeGeometry(6, 6, 6);
    var tinyGeom = new THREE.CubeGeometry( 8, 8, 8 );
    var explMat = new THREE.MeshPhongMaterial( { shininess: 200, ambient: 0xff8080, color: 0xff8080 } );
    for (var i = 0; i < 400; ++i)
    {
        var expl = new THREE.Mesh(tinyGeom, explMat);
        explodeBricks.push(expl);
        expl.rotation.x = Math.random() * Math.PI*2;
        expl.rotation.y = Math.random() * Math.PI*2;
        expl.rotation.z = Math.random() * Math.PI*2;
        expl.castShadow = true;
        expl.receiveShadow = false;
        expl.position.set(10000, -100, 10000);
        scene.add(expl);
        explodeVels.push(new THREE.Vector3(0, 0, 0));
    }

    // OBJECTS

    //var sphereGeometry = new THREE.SphereGeometry( 100, 64, 32 );
    //var torusGeometry = new THREE.TorusGeometry( 240, 60, 32, 64 );
    //var cubeGeometry = new THREE.CubeGeometry( 150, 150, 150 );

    var smallCube = new THREE.CubeGeometry( 100, 100, 100 );


    /*
    var bigCube = new THREE.CubeGeometry( 50, 500, 50 );
    var midCube = new THREE.CubeGeometry( 50, 200, 50 );

    weewaa = addObjectColor( bigCube,   0xff0000, -500, 250, 0, 0 );
    addObjectColor( smallCube, 0xff0000, -500, 50, -150, 0 );

    addObjectColor( midCube,   0x00ff00, 500, 100, 0, 0 );
    addObjectColor( smallCube, 0x00ff00, 500, 50, -150, 0 );

    addObjectColor( midCube,   0x0000ff, 0, 100, -500, 0 );
    addObjectColor( smallCube, 0x0000ff, -150, 50, -500, 0 );

    addObjectColor( midCube,   0xff00ff, 0, 100, 500, 0 );
    addObjectColor( smallCube, 0xff00ff, -150, 50, 500, 0 );

    addObjectColor( new THREE.CubeGeometry( 500, 10, 10 ), 0xffff00, 0, 600, 0, Math.PI/4 );
    addObjectColor( new THREE.CubeGeometry( 250, 10, 10 ), 0xffff00, 0, 600, 0, 0 );

    addObjectColor( new THREE.SphereGeometry( 100, 32, 26 ), 0xffffff, -300, 100, 300, 0 );
    */

    Dopey.init();
    Spinner.init();

    bullets = [];
    for (var i = 0; i < 300; i++)
    {
        var b = addObjectColor(new THREE.SphereGeometry(BULLET_RADIUS, 4, 4), 0x8080ff, 0, 100, 0, 0);
        b.receiveShadow = false;
        b.position.x = b.position.z = 0;
        b.position.y = -100;
        b.vel_ = new THREE.Vector3(0, 0, 0);
        scene.remove(b);
        bullets.push(b);
    }

    ship = addObjectColor(new THREE.CubeGeometry(50, 80, 50), 0x8080ff, 0, 100, 0, 0);
    shipMiddle = addObjectColor(new THREE.CubeGeometry(80, 20, 80), 0x8080ff, 0, 0, 0, 0);
    shipMiddle.receiveShadow = false;
    ship.add(shipMiddle);

    shipPivot = new THREE.Object3D();
    ship.add(shipPivot);

    ship.receiveShadow = false;

    shipTurret = addObjectColor(new THREE.CubeGeometry(20, 20, 80), 0x0000ff, 0, 20, -30, 0);
    scene.remove(shipTurret);
    shipPivot.add(shipTurret);


    // LIGHTS

    var sunIntensity = 0.3,
        pointIntensity = 1,
        pointColor = 0xffaa00;

    ambientLight = new THREE.AmbientLight( 0xffffff );
    ambientLight.color.setHSV( 0.1, 0.9, 0.25 );
    scene.add( ambientLight );

    pointLight = new THREE.PointLight( 0x00aaaa, pointIntensity, 5000 );
    pointLight.position.set( 0, 0, 0 );
    scene.add( pointLight );

    sunLight = new THREE.SpotLight( 0xffffff, sunIntensity );
    sunLight.position.set( 1000, 2000, 1000 );
    sunLight.castShadow = true;
    scene.add( sunLight );

    // RENDERER

    renderer = new THREE.WebGLRenderer( { clearColor: 0x00aaff, clearAlpha: 1, antialias: false } );
    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    if ( scene.fog )
    renderer.setClearColor( scene.fog.color, 1 );

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = MARGIN + "px";
    renderer.domElement.style.left = "0px";

    container.appendChild( renderer.domElement );


    //

    renderer.shadowMapAutoUpdate = false;
    renderer.shadowMapEnabled = true;
    renderer.shadowMapDarkness = 0.5 * sunIntensity;
    renderer.shadowMapBias = 0.00390125;
    renderer.shadowMapWidth = 1024;
    renderer.shadowMapHeight = 1024;

    //

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

    // EVENTS

    window.addEventListener( 'resize', onWindowResize, false );

    // COMPOSER

    renderer.autoClear = false;

    renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBufer: false };
    renderTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );

    effectFXAA = new THREE.ShaderPass( THREE.ShaderExtras[ "fxaa" ] );
    var effectVignette = new THREE.ShaderPass( THREE.ShaderExtras[ "vignette" ] );

    hblur = new THREE.ShaderPass( THREE.ShaderExtras[ "horizontalTiltShift" ] );
    vblur = new THREE.ShaderPass( THREE.ShaderExtras[ "verticalTiltShift" ] );

    var bluriness = 1.5;

    hblur.uniforms[ 'h' ].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms[ 'v' ].value = bluriness / SCREEN_HEIGHT;

    hblur.uniforms[ 'r' ].value = vblur.uniforms[ 'r' ].value = 0.5;

    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );

    composer = new THREE.EffectComposer( renderer, renderTarget );

    var renderModel = new THREE.RenderPass( scene, camera );

    //effectVignette.renderToScreen = true;
    //effectFXAA.renderToScreen = true;
    vblur.renderToScreen = true;

    composer = new THREE.EffectComposer( renderer, renderTarget );

    composer.addPass( renderModel );

    composer.addPass( effectFXAA );

    composer.addPass( hblur );
    composer.addPass( vblur );

    //composer.addPass( effectVignette );

    parameters = { control: 0 };

    easeTo = new THREE.Vector3(0, 0, 0);
    shipVel = new THREE.Vector3(0, 0, 0);
    leftStick = new THREE.Vector3(0, 0, 0);
    rightStick = new THREE.Vector3(0, 0, 0);

    animate();
}

//


function onWindowResize( event ) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );

    composer.reset( renderTarget );

    hblur.uniforms[ 'h' ].value = 4 / SCREEN_WIDTH;
    vblur.uniforms[ 'v' ].value = 4 / SCREEN_HEIGHT;

    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT );

    updateScoreScreenLocation();
}

//

function animate()
{
    requestAnimationFrame( animate );
    render();
}

function ease(from, to, fraction)
{
    if (fraction === undefined) fraction = 0.1;
    return (to - from) * fraction + from;
}

function dead(x, y)
{
    if (Math.sqrt(x*x + y*y) < 0.25)
        return 0;
}

function shoot(x, z, focus)
{
    var b = bullets[bulletIndex++];
    if (bulletIndex == bullets.length) bulletIndex = 0;
    b.position.copy(ship.position);
    b.position.x += x * 50;
    b.position.y += 20;
    b.position.z += z * 50;
    b.vel_.x = x * 25 + (1.0 - focus) * Math.random() * 20;
    b.vel_.y = 0;
    b.vel_.z = z * 25 + (1.0 - focus) * Math.random() * 20;
    scene.add(b);
}

function cube(x)
{
    return x*x*x;
}

function collideSphereWithEnemies(b, rad, onHit)
{
    var len = enemies.length;
    for (var i = 0; i < len; ++i)
    {
        var enemy = enemies[i];
        var dx = b.position.x - enemy.mesh.position.x;
        var dz = b.position.z - enemy.mesh.position.z;
        var dist = dx*dx + dz*dz;
        var minDist = rad + enemy.radius;
        if (dist <= minDist*minDist)
        {
            onHit(b, enemy, i);
            return;
        }
    }
}

function updateExplosions(delta)
{
    var len = explodeBricks.length;
    for (var i = 0; i < len; ++i)
    {
        var b = explodeBricks[i];
        var v = explodeVels[i];
        v.y -= 500 * delta;
        b.position.x += v.x * delta;
        b.position.y += v.y * delta;
        b.position.z += v.z * delta;
        if (b.position.y <= 10) {
            b.position.y = 10;
            v.x = v.y = v.z = 0;
        }
    }
}

function updateEnemies(delta)
{
    var len = enemies.length;
    for (var i = 0; i < len; ++i)
    {
        var e = enemies[i];
        e.update(delta);
    }
}

function bulletEnemyCollide(b, e, ei)
{
    explode(b.position);
    b.position.y = -100;
    e.hitpoints--;
    if (e.hitpoints > 0)
    {
        curScore += 1;
        Sfx.play(Sfx.HIT4);
    }
    else
    {
        curScore += e.scorePoints;
        Sfx.play(Sfx.EXPLODE);
        enemies.splice(ei, 1);
        scene.remove(e.mesh);
        explode(e.mesh.position, 30);
        hacky = 0;
    }
    updateScores();
}

function render() {

    // update
    TWEEN.update();

    var delta = clock.getDelta();
    //console.log(delta);

    scene.fog.color.setHSV( 0.13, 0.25, THREE.Math.mapLinear( parameters.control, 0, 100, 0.1, 0.99 ) );
    renderer.setClearColor( scene.fog.color, 1 );

    sunLight.intensity = THREE.Math.mapLinear( parameters.control, 0, 100, 0.3, 1 );
    pointLight.intensity = THREE.Math.mapLinear( parameters.control, 0, 100, 1, 0.5 );

    pointLight.color.setHSV( 0.1, THREE.Math.mapLinear( parameters.control, 0, 100, 0.99, 0 ), 0.9 );

    renderer.shadowMapDarkness = 0.3;

    function aimAndShoot(dir) {
        var rightStickLen = rightStick.length();
        var rotTurret = true;
        if (fireCountDown > 0)
            fireCountDown -= delta;
        else if (rightStickLen < 0.35)
            rotTurret = false;
        else if (rightStickLen >= 0.35) {
            rightStick.normalize();
            shoot(rightStick.x, rightStick.z, rightStickLen);
            Sfx.play(Sfx.SHOOT);
            fireCountDown += .06;
        }
        if (rotTurret)
            shipPivot.rotation.y = Math.atan2(rightStick.x, rightStick.z) + Math.PI;

    }

    if (mode == 'TITLE')
    {
        ship.position.x = Math.sin(clock.getElapsedTime()) * 500;
        ship.position.z = 700;
        titleShootCounter -= delta;
        if (titleShootCounter > 0)
            aimAndShoot();
        else if (Math.random() < 0.1)
        {
            rightStick.x = Math.random() - 0.5;
            rightStick.z = Math.random() - 0.5;
            rightStick.normalize().multiplyScalar(Math.random());
            aimAndShoot();
            titleShootCounter = Math.random() * 2;
        }
        else if (Math.random() < 0.5)
        {
            explode(new THREE.Vector3(Math.random() * 1000 - 500, 500, Math.random() * 1000 - 500));
        }

        var pads = navigator.webkitGamepads;
        if (pads)
        {
            var possiblePadsLen = pads.length;
            for (var i = 0; i < possiblePadsLen; ++i)
            {
                var pad = navigator.webkitGamepads[i];
                if (pad)
                {
                    for (j = 0; j < pad.buttons.length; ++j)
                    {
                        if (pad.buttons[j] > 0.5)
                        {
                            playerPad = i;
                            mode = 'GAME';
                            Sfx.play(Sfx.SELECT);
                            document.getElementById('title').style.display = 'none';
                        }
                    }
                    break;
                }
            }
        }
    }
    else
    {
        var pad = navigator.webkitGamepads[playerPad];
        leftStick.set(pad.axes[0], 0, pad.axes[1]);
        if (leftStick.length() < 0.25)
            leftStick.set(0, 0, 0);
        else {
            leftStick.x = cube(leftStick.x);
            leftStick.z = cube(leftStick.z);
        }
        shipVel.x = ease(shipVel.x, leftStick.x * 600, 0.2);
        shipVel.z = ease(shipVel.z, leftStick.z * 600, 0.2);
        ship.position.x += shipVel.x * delta;
        ship.position.z += shipVel.z * delta;

        if (pad.buttons[0] > .5 && !window.hacky)
        {
            //new Dopey({ x : -400, y: 115, z: -1000 });
            //new Dopey({ x : 400, y: 115, z: -1000 });
            new Spinner({x: 0, y: 115, z: -400 });
            hacky = 1;
        }

        rightStick.set(pad.axes[2], 0, pad.axes[3]);
        aimAndShoot();

        var origY = ship.position.y;
        ship.position.y = 0;
        var mag = ship.position.length();
        var fieldSize = 910;
        if (mag >= fieldSize) {
            ship.position.normalize().multiplyScalar(fieldSize);
        }
        ship.position.y = origY;
    }

    updateEnemies(delta);
    updateExplosions(delta);

    //console.log(clock.getElapsedTime());
    //weewaa.rotation.y = clock.getElapsedTime();
    //weewaa.position.x = Math.sin(clock.getElapsedTime() / 100.0) * 50;

    camera.position.set( 100, 800, ship.position.z / 4 + 1500 );
    camera.lookAt(new THREE.Vector3(ship.position.x / 10.0,0,ship.position.z / 10.0));

    for (var i = 0; i < bullets.length; ++i)
    {
        var b = bullets[i];
        b.position.x += b.vel_.x;
        b.position.z += b.vel_.z;

        if (b.position.x < -1000 || b.position.z < -1000 || b.position.x > 1000 || b.position.x > 1000 || b.position.y < 0)
            continue;
        collideSphereWithEnemies(b, BULLET_RADIUS, bulletEnemyCollide);
    }

    // render shadow map

    renderer.autoUpdateObjects = false;

    renderer.initWebGLObjects( scene );
    renderer.updateShadowMap( scene, camera );

    // render scene

    renderer.autoUpdateObjects = true;

    //renderer.render( scene, camera );
    //renderer.clearTarget( null, 1, 1, 1 );
    composer.render( 0.1 );

}

init();
