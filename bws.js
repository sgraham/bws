if (!Detector.webgl)
  Detector.addGetWebGLMessage();

var MARGIN = 0;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;
var FAR = 10000;
var container;
var ZERO3 = new THREE.Vector3(0, 0, 0);

var camera, scene, renderer;

var mesh, geometry;

var sunLight, pointLight, ambientLight;

var composer, effectFXAA, hblur, vblur;

var parameters;

var BULLET_RADIUS = 9;

var explodeIndex = 0;

var bulletIndex = 0;
var fireCountDown = 0;
var titleShootCounter = 0;

var curScore = 0;
var highScore = 0;
localforage.getItem('highscore', function(h) {
  if (h) {
    highScore = h;
    document.getElementById('highscore').innerHTML = zeroPadScore(h);
  }
});
var textFaceMaterial = new THREE.MeshFaceMaterial();
textMaterialFront = new THREE.MeshPhongMaterial({color: 0xffffff, shading: THREE.FlatShading});
textMaterialSide = new THREE.MeshPhongMaterial({color: 0xffffff, shading: THREE.SmoothShading});

var mode = 'TITLE';
var configStep = '';

var numScoreDigits = 6;
var textGeos = [];
var textMat = [];
var textMeshes = [];

var playerPad = -1;
var leftStick, rightStick;
var mapping = null;
var savedMappings = {};
var lastAxes = 99;

if (!('getGamepads' in navigator) && 'webkitGetGamepads' in navigator) {
  navigator.getGamepads = function() {
    return navigator.webkitGetGamepads();
  };
}

function findControllerMapping(pad)
{
  if (pad.mapping === 'standard' || pad.id.match('STANDARD GAMEPAD') || pad.id.match('USB'))
  {
    mapping = [0, 1, 2, 3];
    return true;
  }

  // See if we have a saved mapping for this controller.
  if (pad.id in savedMappings)
  {
    mapping = savedMappings[pad.id];
    return true;
  }

  return false;
}

function isInt(n) {
   return n === +n && n === (n|0);
}

function findMinAxis(axes)
{
  var axis = 99;
  for (var i = 0; i < axes.length; i++)
  {
    if (isInt(axes[i]) && axes[i] !== 0 && lastAxes !== axes[i])
    {
      axis = i;
      m = axes[i];
      lastAxes = axes[i];
    }
  }
  return axis;
}
function showConfigStep()
{
  var steps = document.querySelectorAll('#config > h3[id]');
  for (var i = 0; i < steps.length; i++)
  {
    if (steps[i].id === 'CONFIG_' + configStep)
    {
      steps[i].style.display = 'block';
    }
    else
    {
      steps[i].style.display = 'none';
    }
  }
  Sfx.play(Sfx.SELECT);
}

function setUpScore()
{
  for (var i = 0; i <= 9; ++i)
  {
    var text = "" + i;
    var textGeo = new THREE.TextGeometry(text,
            {
              size: 70,
              height: 20,
              curveSegments: 4,
              font: "helvetiker",
              weight: "bold",
              style: "normal",
              bevelThickness: 2,
              bevelSize: 1.5,
              bevelEnabled: true,
              bend: false,
              material: 0,
              extrudeMaterial: 1
            });
    textGeos.push(textGeo);
  }

  textMat = new THREE.MeshPhongMaterial({color: 0xffffff, shading: THREE.SmoothShading});

  updateScores();
}

function zeroPadScore(n)
{
  var ret = "" + n;
  while (ret.length < numScoreDigits)
    ret = "0" + ret;
  return ret;
}

function updateScores()
{
  localforage.getItem('highscore', function(h) {
    if (h) {
      highScore = h;
    }
    if (curScore > highScore)
    {
      highScore = curScore;
      localforage.setItem('highscore', highScore);
    }
    var scoreStr = zeroPadScore(curScore);
    for (var i = 0; i < numScoreDigits; ++i)
    {
      var num = scoreStr[i] - '0';
      scene.remove(textMeshes[i]);
      textMeshes[i] = addObjectColor(textGeos[num], 0xffffff, (i - numScoreDigits / 2) * 100, 80, -1200);
      textMeshes[i].receiveShadow = false;
      // hmm, some update lameness going on here, gunk at origin for 1 frame w/ shadows on
      textMeshes[i].castShadow = false;
    }
  });
}


var explodeScale = 1200;
function explode(at, num)
{
  num = num || 3;
  for (var i = 0; i < num; ++i)
  {
    var obj = explodeBricks[explodeIndex];
    var vel = explodeVels[explodeIndex];
    if (++explodeIndex >= explodeBricks.length)
      explodeIndex = 0;
    obj.position.copy(at);
    vel.x = Math.random() * explodeScale - explodeScale / 2;
    vel.y = Math.random() * explodeScale * 2 - explodeScale / 2;
    vel.z = Math.random() * explodeScale - explodeScale / 2;
  }
}

function addObject(geometry, material, x, y, z, ry)
{
  ry = ry || 0;
  var tmpMesh = new THREE.Mesh(geometry, material);

  tmpMesh.material.color.offsetHSL(0.1, -0.1, 0);

  tmpMesh.position.set(x, y, z);

  tmpMesh.rotation.y = ry;

  tmpMesh.castShadow = true;
  tmpMesh.receiveShadow = true;

  scene.add(tmpMesh);

  return tmpMesh;
}

function addObjectColor(geometry, color, x, y, z, ry)
{
  var material = new THREE.MeshPhongMaterial({color: color, ambient: 0x444444});
  //var material = new THREE.MeshPhongMaterial( { color: color, ambient: color } );
  //THREE.ColorUtils.adjustHSV( material.ambient, 0, 0, -0.5 );

  return addObject(geometry, material, x, y, z, ry);
}

function resetGamepadSettings(e) {
  if (e.keyCode === 82) {
    localforage.removeItem('mappings');
    alert("Gamepad Settings reset successful!");
    window.location.reload();
  }
}


function init()
{
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, SCREEN_WIDTH / SCREEN_HEIGHT, 2, FAR);

  scene = new THREE.Scene();

  scene.fog = new THREE.Fog(0x00aaff, 1000, FAR);
  scene.fog.color.setHSL(0.13, 0.25, 0.1);

  setUpScore();

  // TEXTURES

  var textureSquares = THREE.ImageUtils.loadTexture("bright_squares256.png");
  textureSquares.wrapS = textureSquares.wrapT = THREE.RepeatWrapping;
  textureSquares.magFilter = THREE.NearestFilter;
  textureSquares.repeat.set(50, 50);

  // GROUND

  var groundMaterial = new THREE.MeshPhongMaterial({shininess: 80, ambient: 0x444444, color: 0xffffff, specular: 0xffffff, map: textureSquares});

  var planeGeometry = new THREE.PlaneGeometry(100, 100);

  var ground = new THREE.Mesh(planeGeometry, groundMaterial);
  ground.position.set(0, 0, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.scale.set(1000, 1000, 1000);

  ground.receiveShadow = true;

  scene.add(ground);

  var wallGeom = new THREE.CubeGeometry(25, 70, 5);
  var wallMat = new THREE.MeshPhongMaterial({shininess: 80, ambient: 0x88aa88, color: 0xffffff, specular: 0xffffff, map: textureSquares});
  walls = [];
  var count = 0;
  for (var i = 0; i < 2 * Math.PI; i += Math.PI / 16)
  {
    var wall = new THREE.Mesh(wallGeom, wallMat);
    walls[count++] = wall;
    wall.position.set(1000 * Math.sin(i), 0, 1000 * Math.cos(i));
    wall.scale.set(5, 3, 5);
    wall.rotation.y = i;
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);
  }

  explodeBricks = [];
  explodeVels = [];
  //var tinyCube = THREE.CubeGeometry(6, 6, 6);
  var tinyGeom = new THREE.CubeGeometry(8, 8, 8);
  var explMat = new THREE.MeshPhongMaterial({shininess: 200, ambient: 0xff8080, color: 0xff8080});
  for (var i = 0; i < 400; ++i)
  {
    var expl = new THREE.Mesh(tinyGeom, explMat);
    explodeBricks.push(expl);
    expl.rotation.x = Math.random() * Math.PI * 2;
    expl.rotation.y = Math.random() * Math.PI * 2;
    expl.rotation.z = Math.random() * Math.PI * 2;
    expl.castShadow = true;
    expl.receiveShadow = false;
    expl.position.set(10000, -100, 10000);
    scene.add(expl);
    explodeVels.push(new THREE.Vector3(0, 0, 0));
  }

  Enemy.init();

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

  ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.color.setHSL(0.1, 0.9, 0.12);
  scene.add(ambientLight);

  pointLight = new THREE.PointLight(0x00aaaa, pointIntensity, 3000);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  sunLight = new THREE.SpotLight(0xffffff, sunIntensity);
  sunLight.position.set(-1000, 2000, -1000);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // RENDERER

  renderer = new THREE.WebGLRenderer({clearColor: 0x00aaff, clearAlpha: 1, antialias: false});
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  if (scene.fog)
    renderer.setClearColor(scene.fog.color, 1);

  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = MARGIN + "px";
  renderer.domElement.style.left = "0px";

  container.appendChild(renderer.domElement);

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

  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('keydown', resetGamepadSettings, false);

  // COMPOSER

  renderer.autoClear = false;

  renderTargetParameters = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBufer: false};
  renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);

  effectFXAA = new THREE.ShaderPass(THREE.ShaderExtras[ "fxaa" ]);
  var effectVignette = new THREE.ShaderPass(THREE.ShaderExtras[ "vignette" ]);

  hblur = new THREE.ShaderPass(THREE.ShaderExtras[ "horizontalTiltShift" ]);
  vblur = new THREE.ShaderPass(THREE.ShaderExtras[ "verticalTiltShift" ]);

  var bluriness = 1.5;

  hblur.uniforms[ 'h' ].value = bluriness / SCREEN_WIDTH;
  vblur.uniforms[ 'v' ].value = bluriness / SCREEN_HEIGHT;

  hblur.uniforms[ 'r' ].value = vblur.uniforms[ 'r' ].value = 0.5;

  effectFXAA.uniforms[ 'resolution' ].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);

  composer = new THREE.EffectComposer(renderer, renderTarget);

  var renderModel = new THREE.RenderPass(scene, camera);

  //effectVignette.renderToScreen = true;
  //effectFXAA.renderToScreen = true;
  vblur.renderToScreen = true;

  composer = new THREE.EffectComposer(renderer, renderTarget);

  composer.addPass(renderModel);

  composer.addPass(effectFXAA);

  composer.addPass(hblur);
  composer.addPass(vblur);

  //composer.addPass( effectVignette );

  parameters = {control: 0};

  easeTo = new THREE.Vector3(0, 0, 0);
  shipVel = new THREE.Vector3(0, 0, 0);
  shipSuck = new THREE.Vector3(0, 0, 0);
  leftStick = new THREE.Vector3(0, 0, 0);
  rightStick = new THREE.Vector3(0, 0, 0);

  animate();

  // See if we have any saved controller mappings.
  localforage.getItem('mappings', function(m) {
    if (m) {
      savedMappings = m;
    }
  });
}

//


function onWindowResize(event) {

  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  camera.updateProjectionMatrix();

  renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);

  composer.reset(renderTarget);

  hblur.uniforms[ 'h' ].value = 4 / SCREEN_WIDTH;
  vblur.uniforms[ 'v' ].value = 4 / SCREEN_HEIGHT;

  effectFXAA.uniforms[ 'resolution' ].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);
}

//

function animate()
{
  requestAnimationFrame(animate);
  render();
}

function ease(from, to, fraction)
{
  if (fraction === undefined)
    fraction = 0.1;
  return (to - from) * fraction + from;
}

function dead(x, y)
{
  if (Math.sqrt(x * x + y * y) < 0.25)
    return 0;
}

function shoot(x, z, focus)
{
  var b = bullets[bulletIndex++];
  if (bulletIndex === bullets.length)
    bulletIndex = 0;
  b.position.copy(ship.position);
  b.position.x += x * 50;
  b.position.y += 20;
  b.position.z += z * 50;
  b.vel_.x = x * 1800 + (1.0 - focus) * Math.random() * 20;
  b.vel_.y = 0;
  b.vel_.z = z * 1800 + (1.0 - focus) * Math.random() * 20;
  scene.add(b);
}

function cube(x)
{
  return x * x * x;
}

var collideTmp = new THREE.Vector3();
function collideSphereWithEnemies(b, rad, onHit)
{
  var len = enemies.length;
  for (var i = 0; i < len; ++i)
  {
    var enemy = enemies[i];
    collideTmp.subVectors(b.position, enemy.mesh.position);
    var dist = collideTmp.lengthSq();
    var minDist = rad + enemy.radius;
    if (dist <= minDist * minDist)
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
    v.y -= 800 * delta;
    b.position.x += v.x * delta;
    b.position.y += v.y * delta;
    b.position.z += v.z * delta;
    if (b.position.y <= 10) {
      b.position.y = 10;
      v.x = v.y = v.z = 0;
    }
  }
}

var enemyUpdateTmp1 = new THREE.Vector3();
function updateEnemies(delta)
{
  var len = enemies.length;
  for (var i = 0; i < len; ++i)
  {
    var e = enemies[i];
    e.update(delta);
    enemyUpdateTmp1.copy(e.accel);
    //enemyUpdateTmp1.y = 0;
    enemyUpdateTmp1.multiplyScalar(delta);
    e.vel.add(enemyUpdateTmp1);
    if (e.vel.lengthSq() >= e.maxvel)
      e.vel.setLength(e.maxvel);
    enemyUpdateTmp1.copy(e.vel);
    //enemyUpdateTmp1.y = 0;
    enemyUpdateTmp1.multiplyScalar(delta);
    e.impulse.multiplyScalar(delta);
    enemyUpdateTmp1.add(e.impulse);
    e.impulse.set(0, 0, 0);
    e.mesh.position.add(enemyUpdateTmp1);
    if (collideShipWithEnemy(e))
      return;
  }
}

function explodeEnemy(e, ei)
{
  Sfx.play(Sfx.EXPLODE);
  enemies.splice(ei, 1);
  scene.remove(e.mesh);
  explode(e.mesh.position, 50);
}

var bulletImpactTmp = new THREE.Vector3();
function bulletEnemyCollide(b, e, ei)
{
  explode(b.position);
  b.position.y = -100;
  scene.remove(b);
  e.hitpoints--;
  if (e.hitpoints > 0)
  {
    curScore += 1;
    bulletImpactTmp.copy(b.vel_);
    bulletImpactTmp.setLength(1300);
    e.impulse.copy(bulletImpactTmp);
    Sfx.play(Sfx.HIT4);
  }
  else
  {
    var timeToDead = Math.floor((clock.getElapsedTime() - e.spawnTime) * 10);
    curScore += Math.max(0, e.scorePoints - timeToDead);
    explodeEnemy(e, ei);
  }
  updateScores();
}

function updateBullets(delta)
{
  for (var i = 0; i < bullets.length; ++i)
  {
    var b = bullets[i];
    b.position.x += b.vel_.x * delta;
    b.position.z += b.vel_.z * delta;
    collideSphereWithEnemies(b, BULLET_RADIUS, bulletEnemyCollide);
  }
}

var collideShipTmp = new THREE.Vector3();
var shipRadius = 25;
function collideShipWithEnemy(e)
{
  collideShipTmp.subVectors(e.mesh.position, ship.position);
  var dist = collideShipTmp.lengthSq();
  var minDist = shipRadius + e.radius;
  if (dist <= minDist * minDist)
  {
    explode(ship.position, 200);
    Sfx.play(Sfx.EXPLODE_DIE);
    var enemiesLength = enemies.length;
    for (var i = enemiesLength - 1; i >= 0; --i)
    {
      explodeEnemy(enemies[i], i);
    }
    mode = 'TITLE';
    document.getElementById('highscore').innerHTML = zeroPadScore(highScore);
    document.getElementById('lastscore').innerHTML = zeroPadScore(curScore);
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('config').style.display = 'none';
    document.getElementById('title').style.display = 'block';
    return true;
  }
  return false;
}

var waveIndex = -1;
function spawnNewEnemies()
{
  if (enemies.length > 0)
    return;
  waveIndex++;
  if (waveIndex === Waves.length)
    waveIndex = 0;
  Waves[waveIndex]();
}

function render() {

  // update
  TWEEN.update();

  var delta = clock.getDelta();
  scene.fog.color.setHSL(0.13, 0.25, THREE.Math.mapLinear(parameters.control, 0, 100, 0.1, 0.4));
  renderer.setClearColor(scene.fog.color, 1);

  sunLight.intensity = THREE.Math.mapLinear(parameters.control, 0, 100, 0.3, 1);
  pointLight.intensity = THREE.Math.mapLinear(parameters.control, 0, 100, 1, 0.5);

  pointLight.color.setHSL(0.1, THREE.Math.mapLinear(parameters.control, 0, 100, 0.99, 0), 0.4);

  renderer.shadowMapDarkness = 0.3;

  function doMovement() {
    var pad = navigator.getGamepads()[playerPad];
    leftStick.set(pad.axes[mapping[0]], 0, pad.axes[mapping[1]]);
    if (leftStick.length() < 0.25)
      leftStick.set(0, 0, 0);
    else {
      leftStick.x = cube(leftStick.x);
      leftStick.z = cube(leftStick.z);
    }
    shipVel.x = ease(shipVel.x, leftStick.x * 600, 0.2);
    shipVel.z = ease(shipVel.z, leftStick.z * 600, 0.2);
    ship.position.x += (shipVel.x + shipSuck.x) * delta;
    ship.position.z += (shipVel.z + shipSuck.z) * delta;
    shipSuck.set(0, 0, 0);
  }

  function doAiming() {
    var pad = navigator.getGamepads()[playerPad];
    rightStick.set(pad.axes[mapping[2]], 0, pad.axes[mapping[3]]);
  }

  function aimAndShoot() {
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
      fireCountDown += .08;
    }
    if (rotTurret)
      shipPivot.rotation.y = Math.atan2(rightStick.x, rightStick.z) + Math.PI;

  }

  function findButtonPress(pads) {
    var possiblePadsLen = pads.length;
    for (var i = 0; i < possiblePadsLen; ++i)
    {
      var pad = pads[i];
      if (pad)
      {
        for (j = 0; j < pad.buttons.length && j < 4; ++j)
        {
          if ((typeof (pad.buttons[j]) === "number" &&
                  pad.buttons[j] > 0.5) ||
                  pad.buttons[j].pressed)
          {
            return i;
          }
        }
      }
    }
    return -1;
  }

  function startGame() {
    mode = 'GAME';
    Sfx.play(Sfx.SELECT);
    document.getElementById('title').style.display = 'none';
  }

  if (mode === 'TITLE')
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

    var pads = navigator.getGamepads();
    if (pads)
    {
      var foundPad = findButtonPress(pads);
      if (foundPad !== -1)
      {

        playerPad = foundPad;
        var pad = pads[foundPad];
        waveIndex = -1;
        curScore = 0;
        updateScores();
        if (findControllerMapping(pad))
        {
          startGame();
        }
        else
        {
          mode = 'CONFIG';
          // Left stick axes are always 0, 1 on every
          // controller I've seen.
          mapping = [0, 1];
          configStep = 'RIGHT_X';
          showConfigStep();
          document.getElementById('overlay').style.display = 'none';
          document.getElementById('config').style.display = 'block';
        }
      }
    }
  }
  else if (mode === 'CONFIG')
  {
    pad = navigator.getGamepads()[playerPad];
    if (configStep === 'RIGHT_X' || configStep === 'RIGHT_Y')
    {
      var axis = findMinAxis(pad.axes);
      if (axis !== 99)
      {
        mapping.push(axis);
        if (configStep === 'RIGHT_X')
        {
          configStep = 'RIGHT_Y';
          showConfigStep();
        }
        else
        {
          configStep = 'TEST';
          showConfigStep();
        }
      }
    }
    else  // TEST
    {
      doMovement();
      doAiming();
      aimAndShoot();
      foundPad = findButtonPress(navigator.getGamepads());
      if (foundPad === playerPad)
      {
        savedMappings[pad.id] = mapping;
        startGame();
      } else {
          // Save mapping in localStorage
        localforage.getItem('mappings', function(m) {
          m = m || {};
          m[pad.id] = mapping;
          localforage.setItem('mappings', m);
        });
      }
    }
  }
  else  // GAME
  {
    doMovement();

    spawnNewEnemies();

    doAiming();
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
  updateBullets(delta);
  updateExplosions(delta);

  camera.position.set(100, 1000, ship.position.z / 3 + 1500);
  camera.lookAt(new THREE.Vector3(ship.position.x / 6.0, 0, ship.position.z / 6.0));

  // render shadow map

  renderer.autoUpdateObjects = false;

  renderer.initWebGLObjects(scene);
  renderer.updateShadowMap(scene, camera);

  // render scene

  renderer.autoUpdateObjects = true;

  composer.render(0.1);

}

init();
