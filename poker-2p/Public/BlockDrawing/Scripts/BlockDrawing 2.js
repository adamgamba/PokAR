// @input Component.ScriptComponent blockSync
// @input Component.Camera camera
// @input Asset.RenderMesh cubeOneUnitMesh
// @input Asset.Material cubeMaterial
// @input Asset.Material vizGridMaterial
// @input Asset.Material vizGridInactiveMaterial

// * My code additions
//@input Component.Text headerText
script.numStacksPlaced = 0;
script.headerText.text = "";

//@input Component.Text stackANumber
//@input Component.Text stackBNumber
//@input Component.Text potNumber

script.stackPositions = {
  A: [],
  B: [],
  POT: [],
};

// * end

var utils = global.utils;
var log = utils.makeLogger("BlockDrawing");

const GRID_SIZE = 2.5;

// Colors
var blockColors = [
  "#fff30c", //yellow
  "#fb400a", //red
  "#2250ff", //blue
  "#23de93", //green
  "#fb8795", //pink
].map(hexToVec4);

// Expose the current color
script.api.getCurrentColor = function () {
  if (script.currentColor) {
    return script.currentColor;
  } else {
    return blockColors[0];
  }
};

script.api.getCursorWorldPosition = function () {
  if (script.ghostCursor) {
    return script.ghostCursor.getTransform().getWorldPosition();
  } else {
    return new vec3(0, 0, 0);
  }
};

script.api.getCursorWorldPositionQuantized = function () {
  if (script.cursorPositionQuantized) {
    return script.cursorPositionQuantized;
  } else {
    return false;
  }
};

script.api.getGridSize = function () {
  return GRID_SIZE;
};

// On device this script does not run when the scene object is enabled
script.api.start = function () {
  print("Block drawing started");

  // Enable full screen touches
  global.touchSystem.touchBlocking = true;
  // Don't double-tap to be passed through to Snapchat to flip the camera.
  global.touchSystem.enableTouchBlockingException(
    "TouchTypeDoubleTap",
    false
  );

  script.touchPosition = new vec2(0, 0);
  script.isTouching = false;

  script.api.isConnectionFailed = false;

  var touchStartEvent = script.createEvent("TouchStartEvent");
  touchStartEvent.bind(onTouchStarted);

  var touchEndEvent = script.createEvent("TouchEndEvent");
  touchEndEvent.bind(onTouchEnded);

  var touchMoveEvent = script.createEvent("TouchMoveEvent");
  touchMoveEvent.bind(onTouchMoved);

  var updateEvent = script.createEvent("UpdateEvent");
  updateEvent.bind(onUpdate);

  script.framesActive = 0;
  script.numFramesTouchDown = 0;
  script.cubeCounter = 0;
  script.occupancy = [];
  script.hasAppliedVizGrid = false;

  script.currentColor = randomFrom(blockColors);

  script.api.setCurrentColorByIndex = function (idx) {
    script.currentColor = blockColors[idx];
  };

  script.cubeHiddenLastFrame = null;

  init();

  // ----------------------------------------------------------------------------
  function init() {
    // Connect
    script.cursor = getNewCubeSceneObject();
    script.cursorMeshVisual = script.cursor.getComponent(
      "Component.RenderMeshVisual"
    );

    script.cursorMeshVisual.mainPass.baseColor = script.currentColor;

    script.ghostCursor = getNewCubeSceneObject();
    script.ghostCursorMeshVisual = script.ghostCursor.getComponent(
      "Component.RenderMeshVisual"
    );
    script.ghostCursorMeshVisual.mainPass.baseColor = new vec4(
      script.currentColor.x,
      script.currentColor.y,
      script.currentColor.z,
      0.15
    );
    script.ghostCursorMeshVisual.setRenderOrder(9999);

    print("Initialised Block Drawing");
  }

  // ----------------------------------------------------------------------------
  function onUpdate(eventData) {
    script.cursorMeshVisual.mainPass.baseColor = script.currentColor;
    script.ghostCursorMeshVisual.mainPass.baseColor = new vec4(
      script.currentColor.x,
      script.currentColor.y,
      script.currentColor.z,
      0
    );

    var pos = new vec2(0.5, 0.6);
    var dist = 60; // This sets the distance
    var p1 = script.camera.screenSpaceToWorldSpace(pos, dist);

    var gridIndices = getOccupancyGridIndices(p1);

    var p1Quantized = getQuantizedPosition(p1);
    p1Quantized = p1Quantized.add(
      new vec3(GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE / 2)
    );
    script.cursorPositionQuantized = p1Quantized;

    var interpolatedP = vec3.lerp(
      script.cursor.getTransform().getWorldPosition(),
      p1Quantized,
      0.35
    );

    script.cursor.getTransform().setWorldPosition(interpolatedP);
    script.ghostCursor.getTransform().setWorldPosition(p1);

    if (script.cubeHiddenLastFrame) {
      script.cubeHiddenLastFrame.enabled = true;
    }

    script.cubeHiddenLastFrame = getValueInOccupancyGrid(
      gridIndices.x,
      gridIndices.y,
      gridIndices.z,
      script.occupancy
    );

    if (script.cubeHiddenLastFrame) {
      script.cubeHiddenLastFrame.enabled = false;
    }

    if (script.isTouching) {
      script.numFramesTouchDown++;
    }

    // If we have started using the color picker we need to
    // ignore the touch down but we don't find out until next frame
    if (script.numFramesTouchDown > 1) {
      if (!isOccupied(p1Quantized, script.occupancy)) {
        var positionArray = vec3ToArray(p1Quantized);
        var colorArray = vec4ToArray(script.currentColor);
        script.blockSync.api.create(positionArray, colorArray); // Tell others
        createBlock(positionArray, colorArray); // Create here
      }
    }
  }

  // ----------------------------------------------------------------------------
  function createBlock(positionArray, colorArray) {
    // We currently have no way of sending a message to just one user, so when a new user joins and the host
    // decides to send them the state of the drawing it will be received by everyone, so we add a check here
    // to avoid creating cubes twice
    if (isOccupied(vec3FromArray(positionArray), script.occupancy)) {
      print("Did not create cube for data as grid pos was occupied ");
      return;
    }

    switch (script.numStacksPlaced) {
      case 0:
        print("case 0");
        script.headerText.text = "placed A";
        script.stackPositions["A"] = positionArray;
        break;
      case 1:
        print("case 1");
        script.headerText.text = "placed B";
        script.stackPositions["B"] = positionArray;
        break;
      case 2:
        print("case 2");
        script.headerText.text = "placed POT";
        script.stackPositions["POT"] = positionArray;
        break;
      default:
        return;
    }
    script.numStacksPlaced += 1;
    print("create block... num blocks = " + script.numStacksPlaced);

    // // * test chip denominations
    // print("stack a size = " + parseInt(script.stackANumber.text));

    // renderChipStacks(
    //   positionArray,
    //   parseInt(script.stackANumber.text),
    //   colorArray
    // );
  }

  function renderChipStacks() {
    // Render stack "A"
    var stackName = "A";
    var amount = parseInt(script.stackANumber.text);
    var positionArray = script.stackPositions[stackName];
    var colorArray = vec4ToArray(script.currentColor);
    renderChipStack(positionArray, amount, colorArray, stackName);

    // Render stack "B"
    stackName = "B";
    amount = parseInt(script.stackBNumber.text);
    positionArray = script.stackPositions[stackName];
    colorArray = vec4ToArray(script.currentColor);
    renderChipStack(positionArray, amount, colorArray, stackName);

    // Render stack "POT"
    stackName = "POT";
    amount = parseInt(script.potNumber.text);
    positionArray = script.stackPositions[stackName];
    colorArray = vec4ToArray(script.currentColor);
    renderChipStack(positionArray, amount, colorArray, stackName);
  }

  function renderChipStack(
    positionArray,
    amount,
    colorArray,
    stackName
  ) {
    var remainder = amount;

    var num25s = Math.floor(remainder / 25);
    remainder = remainder % 25;
    var num5s = Math.floor(remainder / 5);
    remainder = remainder % 5;
    var num1s = remainder;

    print("num25s = " + num25s);
    print("num5s = " + num5s);
    print("num1s = " + num1s);

    var stackPos = positionArray.slice();

    // Render 25s
    for (var i = 0; i < num25s; i++) {
      var new25s = getNewCubeSceneObject();
      updateBlock(new25s, stackPos, colorArray);
      stackPos[1] += 2.5;
      //   script.stackPositions[stackName].push({
      //     pos: stackPos,
      //     color: "green",
      //   });
    }
    // Render 5s
    stackPos = positionArray.slice();
    stackPos[0] += 5;
    for (var i = 0; i < num5s; i++) {
      var new5s = getNewCubeSceneObject();
      updateBlock(new5s, stackPos, colorArray);
      stackPos[1] += 2.5;
      //   script.stackPositions[stackName].push({
      //     pos: stackPos,
      //     color: "red",
      //   });
    }
    // Render 1s
    stackPos = positionArray.slice();
    stackPos[0] += 10;
    for (var i = 0; i < num1s; i++) {
      var new1s = getNewCubeSceneObject();
      updateBlock(new1s, stackPos, colorArray);
      stackPos[1] += 2.5;
      //   script.stackPositions[stackName].push({
      //     pos: stackPos,
      //     color: "white",
      //   });
    }

    print(
      "script.stackPositions: " + JSON.stringify(script.stackPositions)
    );

    // *

    // return newCube; // ? what do i do w this?
  }

  // ----------------------------------------------------------------------------
  function updateBlock(target, positionArray, colorArray) {
    var pos = vec3FromArray(positionArray);
    var color = vec4FromArray(colorArray);

    target.getTransform().setWorldPosition(pos);
    storeInOccupancyGrid(target, pos, script.occupancy);

    var cubeMeshVisual = target.getComponent(
      "Component.RenderMeshVisual"
    );
    cubeMeshVisual.meshShadowMode = 1;
    cubeMeshVisual.mainPass.baseColor = color;
  }

  // ----------------------------------------------------------------------------
  script.blockSync.api.events.on(
    "create",
    function (positionArray, colorArray) {
      createBlock(positionArray, colorArray);
    }
  );

  // ----------------------------------------------------------------------------
  function getQuantizedPosition(pos) {
    var p = new vec3(
      Math.floor(pos.x / GRID_SIZE) * GRID_SIZE,
      Math.floor(pos.y / GRID_SIZE) * GRID_SIZE,
      Math.floor(pos.z / GRID_SIZE) * GRID_SIZE
    );
    return p;
  }

  // ----------------------------------------------------------------------------
  function getNewCubeSceneObject(optionalSceneObject) {
    print("getNewCubeSceneObject()...");
    script.cubeCounter++;

    var cube = scene.createSceneObject("Cube" + script.cubeCounter);
    var cursorMeshVisual = cube.createComponent("Component.MeshVisual");
    cursorMeshVisual.mesh = script.cubeOneUnitMesh;
    cursorMeshVisual.meshShadowMode = 1;
    cursorMeshVisual.clearMaterials();
    cursorMeshVisual.addMaterial(script.cubeMaterial.clone());
    cube
      .getTransform()
      .setLocalScale(new vec3(GRID_SIZE, GRID_SIZE, GRID_SIZE));

    return cube;
  }

  // ----------------------------------------------------------------------------
  function getOccupancyGridIndices(pos) {
    var indexX = Math.floor(pos.x / GRID_SIZE);
    var indexY = Math.floor(pos.y / GRID_SIZE);
    var indexZ = Math.floor(pos.z / GRID_SIZE);

    return { x: indexX, y: indexY, z: indexZ };
  }

  // ----------------------------------------------------------------------------
  function isOccupied(pos, occupancy) {
    var indices = getOccupancyGridIndices(pos);

    if (typeof occupancy[indices.x] === "undefined") {
      return false;
    }
    if (typeof occupancy[indices.x][indices.y] === "undefined") {
      return false;
    }
    if (
      typeof occupancy[indices.x][indices.y][indices.z] === "undefined"
    ) {
      return false;
    }

    return true;
  }

  // ----------------------------------------------------------------------------
  function getValueInOccupancyGrid(indexX, indexY, indexZ, occupancy) {
    if (typeof occupancy[indexX] === "undefined") {
      return null;
    }
    if (typeof occupancy[indexX][indexY] === "undefined") {
      return null;
    }
    if (typeof occupancy[indexX][indexY][indexZ] === "undefined") {
      return null;
    }

    return occupancy[indexX][indexY][indexZ];
  }

  // ----------------------------------------------------------------------------
  function storeInOccupancyGrid(cubeSceneObject, pos, occupancy) {
    var indices = getOccupancyGridIndices(pos);

    if (typeof occupancy[indices.x] === "undefined") {
      occupancy[indices.x] = [];
    }
    if (typeof occupancy[indices.x][indices.y] === "undefined") {
      occupancy[indices.x][indices.y] = [];
    }

    occupancy[indices.x][indices.y][indices.z] = cubeSceneObject;
  }

  // ----------------------------------------------------------------------------
  function onTouchMoved(eventData) {
    script.touchPosition = eventData.getTouchPosition();
  }

  // ----------------------------------------------------------------------------
  function onTouchStarted(eventData) {
    print("onTouchStarted().,,");
    // TODO: check against screen region
    var touchPosition = eventData.getTouchPosition();
    if (touchPosition.y < 0.85 && touchPosition.y > 0.15) {
      script.touchPosition = touchPosition;
      script.isTouching = true;
      script.numFramesTouchDown = 0;
    }
  }

  // ----------------------------------------------------------------------------
  function onTouchEnded(eventData) {
    print("onTouchEnded().,,");
    script.touchPosition = eventData.getTouchPosition();
    script.isTouching = false;
    script.numFramesTouchDown = 0;
  }

  // ----------------------------------------------------------------------------
  function vec3FromArray(a) {
    return new vec3(a[0], a[1], a[2]);
  }

  // ----------------------------------------------------------------------------
  function vec3ToArray(v) {
    return [v.x, v.y, v.z];
  }

  // ----------------------------------------------------------------------------
  function vec4FromArray(a) {
    return new vec4(a[0], a[1], a[2], a[3]);
  }

  // ----------------------------------------------------------------------------
  function vec4ToArray(v) {
    return [v.x, v.y, v.z, v.w];
  }

  // ----------------------------------------------------------------------------
  function randomFrom(arr) {
    if (arr.length < 1) {
      return;
    }
    return arr[Math.floor(Math.random() * arr.length)];
  }
};

// ----------------------------------------------------------------------------
function hexToVec4(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return new vec4(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
    1
  );
}
