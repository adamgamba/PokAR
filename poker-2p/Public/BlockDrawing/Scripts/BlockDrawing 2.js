// @input Component.ScriptComponent blockSync
// @input Component.Camera camera
// @input Asset.RenderMesh chipMesh
// @input Asset.Material chipWhite
// @input Asset.Material chipRed
// @input Asset.Material chipGreen
// @input Asset.Material chipBlack
// @input Asset.Material cubeMaterial
// @input Asset.Material vizGridMaterial
// @input Asset.Material vizGridInactiveMaterial

// * My code additions
//@input Component.Text headerText
//@input int numStacksPlaced
// script.numStacksPlaced = 0;
// script.headerText.text = "";

//@input Component.Text stackANumber
//@input Component.Text stackBNumber
//@input Component.Text potNumber

// @input Component.ScriptComponent objectSpawner
// @input Component.ScriptComponent packets

//@input SceneObject startGameScreen
//@input SceneObject startGameScreenHolder

// * Marker objects
//@input SceneObject markerStackA
//@input SceneObject markerStackB
//@input SceneObject markerStackPot

// * 3D Text Objects
//@input Component.Text3D textStackAFacingA
//@input Component.Text3D textStackBFacingA
//@input Component.Text3D textStackPotFacingA
//@input Component.Text3D textStackAFacingB
//@input Component.Text3D textStackBFacingB
//@input Component.Text3D textStackPotFacingB

script.stackPositions = {
  A: [],
  B: [],
  POT: [],
};
script.sceneObjects = [];
chipColors = {
  WHITE: "white",
  RED: "red",
  GREEN: "green",
  BLACK: "black",
};

// * end

var packets = script.packets.api;
var utils = global.utils;
var log = utils.makeLogger("BlockDrawing");

const GRID_SIZE = 1;

// Colors
var blockColors = [
  "#ffffff",
  //   "#fff30c", //yellow
  //   "#fb400a", //red
  //   "#2250ff", //blue
  //   "#23de93", //green
  //   "#fb8795", //pink
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

  //   script.headerText.text = "Select location for your stack";

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

    script.cursor.enabled = false;
    script.ghostCursor.enabled = false;
    // if (script.numStacksPlaced >= 3) {
    //   script.cursor.enabled = false;
    //   script.ghostCursor.enabled = false;
    // }

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

    // renderChipStacks();
    // Enable start buttons
    script.startGameScreen.enabled = true;
    script.startGameScreenHolder.enabled = true;
    // // If we have started using the color picker we need to
    // // ignore the touch down but we don't find out until next frame
    // if (script.numFramesTouchDown >= 1) {
    //   if (!isOccupied(p1Quantized, script.occupancy)) {
    //     var positionArray = vec3ToArray(p1Quantized);
    //     var colorArray = vec4ToArray(script.currentColor);
    //     script.blockSync.api.create(positionArray, colorArray); // Tell others
    //     createBlock(positionArray, colorArray); // Create here
    //   }
    // }
  }

  // ----------------------------------------------------------------------------
  //   function createBlock(positionArray, colorArray) {
  //     // We currently have no way of sending a message to just one user, so when a new user joins and the host
  //     // decides to send them the state of the drawing it will be received by everyone, so we add a check here
  //     // to avoid creating cubes twice
  //     if (isOccupied(vec3FromArray(positionArray), script.occupancy)) {
  //       print("Did not create cube for data as grid pos was occupied ");
  //       return;
  //     }

  //     // switch (script.numStacksPlaced) {
  //     //   case 0:
  //     //     print("case 0");
  //     //     script.headerText.text = "Select location for opponent's stack";
  //     //     script.stackPositions["A"] = positionArray;
  //     //     break;
  //     //   case 1:
  //     //     print("case 1");
  //     //     // Check if its too close to A
  //     //     print("stack pos A = " + script.stackPositions["A"]);
  //     //     print("pos Array = " + positionArray);
  //     //     var dist = distBetween(
  //     //       script.stackPositions["A"],
  //     //       positionArray
  //     //     );
  //     //     print("DIST BETWEEN A AND B = " + dist);
  //     //     if (dist < GRID_SIZE * 4) {
  //     //       return;
  //     //     }

  //     //     script.headerText.text = "Select location for the pot";
  //     //     script.stackPositions["B"] = positionArray;
  //     //     break;
  //     //   case 2:
  //     //     // print("case 2");
  //     //     // print("stack pos A = " + script.stackPositions["A"]);
  //     //     // print("stack pos B = " + script.stackPositions["B"]);
  //     //     // print("pos Array = " + positionArray);
  //     //     // Check if its too close to A OR B
  //     //     var distA = distBetween(
  //     //       script.stackPositions["A"],
  //     //       positionArray
  //     //     );
  //     //     var distB = distBetween(
  //     //       script.stackPositions["B"],
  //     //       positionArray
  //     //     );
  //     //     // print("DIST BETWEEN A AND POT = " + distA);
  //     //     // print("DIST BETWEEN B AND POT = " + distB);
  //     //     if (distA < GRID_SIZE * 4 || distB < GRID_SIZE * 4) {
  //     //       return;
  //     //     }

  //     //     script.headerText.text = "";
  //     //     script.stackPositions["POT"] = positionArray;

  //     //     // Enable start buttons
  //     //     script.startGameScreen.enabled = true;
  //     //     script.startGameScreenHolder.enabled = true;

  //     //     packets.sendObject(
  //     //       "/poker/sendStackPositions/",
  //     //       script.stackPositions
  //     //     );

  //     //     break;
  //     //   default:
  //     //     print("click ignored");
  //     //     return;
  //     // }

  //     // print("text: script.numStacksPlaced = " + script.numStacksPlaced);
  //     // print("typeof = " + typeof script.numStacksPlaced);
  //     // script.numStacksPlaced += 1; // ?
  //     // print("text: script.numStacksPlaced = " + script.numStacksPlaced);

  //     // var objectSpawner = script.objectSpawner.api;

  //     // print("OBJECT SPAWNER:" + JSON.stringify(objectSpawner));
  //     // for (var x in objectSpawner) {
  //     //   print("x:" + x);
  //     //   //   print("x[]:" + objectSpawner[x]);
  //     // }

  //     // objectSpawner.onStartRemote();
  //     print("create block... num blocks = " + script.numStacksPlaced);
  //     renderChipStacks();

  //     // // * test chip denominations
  //     // print("stack a size = " + parseInt(script.stackANumber.text));

  //     // renderChipStacks(
  //     //   positionArray,
  //     //   parseInt(script.stackANumber.text),
  //     //   colorArray
  //     // );
  //   }

  // Calculates 3d distance between two length-3 arrays
  function distBetween(v1, v2) {
    return (
      ((v1[0] - v2[0]) ** 2 +
        (v1[1] - v2[1]) ** 2 +
        (v1[2] - v2[2]) ** 2) **
      0.5
    );
  }

  function disableAllStacks() {
    for (var i = 0; i < script.markerStackA.getChildrenCount(); i++) {
      script.markerStackA.getChild(i).enabled = false;
      script.textStackAFacingA.text = "";
      script.textStackAFacingB.text = "";
    }
    for (var i = 0; i < script.markerStackB.getChildrenCount(); i++) {
      script.markerStackB.getChild(i).enabled = false;
      script.textStackBFacingA.text = "";
      script.textStackBFacingB.text = "";
    }
    for (var i = 0; i < script.markerStackPot.getChildrenCount(); i++) {
      script.markerStackPot.getChild(i).enabled = false;
      script.textStackPotFacingA.text = "";
      script.textStackPotFacingB.text = "";
    }
  }

  function renderChipStacks() {
    print("render chip stack...");

    // * New function (enable and disable existing chips)
    // Destroy existing scene objects
    print("destroying existing stacks...");
    disableAllStacks();

    // for (var i in script.sceneObjects) {
    //   var obj = script.sceneObjects[i];
    //   obj.destroy();
    //   print("destroyed obj" + obj);
    // }

    // script.sceneObjects = [];
    // scene.clearScreen(); // ?

    // Render stack "A"
    var stackName = "A";
    print("stackname:" + stackName);
    var amount = parseInt(script.stackANumber.text);
    print("amount:" + amount);

    // var positionArray = script.stackPositions[stackName];
    // var colorArray = vec4ToArray(script.currentColor);
    enableChipStack(stackName, amount);
    script.textStackAFacingA.text = "Me: $" + amount.toString();
    script.textStackAFacingB.text = "Opponent: $" + amount.toString();

    // Render stack "B"
    stackName = "B";
    amount = parseInt(script.stackBNumber.text);
    enableChipStack(stackName, amount);
    script.textStackBFacingA.text = "Opponent: $" + amount.toString();
    script.textStackBFacingB.text = "Me: $" + amount.toString();

    // Render stack "B"
    stackName = "POT";
    amount = parseInt(script.stackBNumber.text);
    enableChipStack(stackName, amount);
    script.textStackPotFacingA.text = "Pot: $" + amount.toString();
    script.textStackPotFacingB.text = "Pot: $" + amount.toString();

    // script.markerStackPot.getChild(0).enabled = false;
    // script.markerStackPot.getChild(1).enabled = false;
    // script.markerStackPot.getChild(2).enabled = false;
    // script.markerStackPot.getChild(3).enabled = false;
    // script.markerStackPot.getChild(4).enabled = false;

    // * end test

    // print(
    //   "marker stack A location:" +
    //     script.markerStackA.getTransform().getWorldPosition()
    // );
    // print(
    //   "marker stack B location:" +
    //     script.markerStackB.getTransform().getWorldPosition()
    // );

    // * test
    // if (script.numStacksPlaced < 3) {
    //   return;
    // }
    // print(
    //   "old stack positions:" + JSON.stringify(script.stackPositions)
    // );

    // var stackAPos = script.markerStackA
    //   .getTransform()
    //   .getWorldPosition();
    // var stackBPos = script.markerStackB
    //   .getTransform()
    //   .getWorldPosition();
    // var stackPotPos = script.markerStackPot
    //   .getTransform()
    //   .getWorldPosition();
    // script.stackPositions["A"][0] = stackAPos.x;
    // script.stackPositions["A"][1] = stackAPos.y;
    // script.stackPositions["A"][2] = stackAPos.z;
    // script.stackPositions["B"][0] = stackBPos.x;
    // script.stackPositions["B"][1] = stackBPos.y;
    // script.stackPositions["B"][2] = stackBPos.z;
    // script.stackPositions["POT"][0] = stackPotPos.x;
    // script.stackPositions["POT"][1] = stackPotPos.y;
    // script.stackPositions["POT"][2] = stackPotPos.z;
    // script.stackPositions["A"][1] += 2;
    // script.stackPositions["B"] = script.markerStackB
    //   .getTransform()
    //   .getWorldPosition();
    // script.stackPositions["POT"] = script.markerStackPot
    //   .getTransform()
    //   .getWorldPosition();
    // print(
    //   "new stack positions:" + JSON.stringify(script.stackPositions)
    // );
    // * end test

    // ! Remove below?
    // // Destroy existing scene objects
    // print("destroying existing stacks..." + script.sceneObjects);

    // for (var i in script.sceneObjects) {
    //   var obj = script.sceneObjects[i];
    //   obj.destroy();
    //   print("destroyed obj" + obj);
    // }

    // script.sceneObjects = [];
    // // scene.clearScreen(); // ?

    // // Render stack "A"
    // var stackName = "A";
    // print("stackname:" + stackName);
    // var amount = parseInt(script.stackANumber.text);
    // print("amount:" + amount);

    // var positionArray = script.stackPositions[stackName];
    // var colorArray = vec4ToArray(script.currentColor);
    // renderChipStack(positionArray, amount, colorArray, stackName);

    // // Render stack "B"
    // stackName = "B";
    // amount = parseInt(script.stackBNumber.text);
    // positionArray = script.stackPositions[stackName];
    // colorArray = vec4ToArray(script.currentColor);
    // renderChipStack(positionArray, amount, colorArray, stackName);

    // // Render stack "POT"
    // stackName = "POT";
    // amount = parseInt(script.potNumber.text);
    // positionArray = script.stackPositions[stackName];
    // colorArray = vec4ToArray(script.currentColor);
    // renderChipStack(positionArray, amount, colorArray, stackName);
    // ! end
  }
  script.api.renderChipStacks = renderChipStacks;

  function enableChipStack(stackName, amount) {
    var stackObj = null;
    switch (stackName) {
      case "A":
        stackObj = script.markerStackA;
        break;
      case "B":
        stackObj = script.markerStackB;
        break;
      case "POT":
        stackObj = script.markerStackPot;
        break;
      default:
        print("uh oh - shouldn't reach this");
    }

    // Calculate nums of each chip type
    var remainder = amount;

    var num100s = 0;
    if (amount > 100) {
      num100s = Math.floor(remainder / 100);
      remainder = remainder % 100;
    }

    var num25s = Math.floor(remainder / 25);
    remainder = remainder % 25;
    var num5s = Math.floor(remainder / 5);
    remainder = remainder % 5;
    var num1s = remainder;

    // Render 100s (assuming max stack = 200)
    if (num100s > 0) {
      stackObj.getChild(0).enabled = true;
    }

    // Render 25s
    var startingIndex = 1;
    for (var i = 0; i < num25s; i++) {
      stackObj.getChild(i + startingIndex).enabled = true;
    }

    // Render 5s
    startingIndex = 5;
    for (var i = 0; i < num5s; i++) {
      stackObj.getChild(i + startingIndex).enabled = true;
    }

    // Render 15s
    startingIndex = 9;
    for (var i = 0; i < num1s; i++) {
      stackObj.getChild(i + startingIndex).enabled = true;
    }
  }

  //   function renderChipStack(
  //     positionArray,
  //     amount,
  //     colorArray,
  //     stackName
  //   ) {
  //     var remainder = amount;

  //     var num25s = Math.floor(remainder / 25);
  //     remainder = remainder % 25;
  //     var num5s = Math.floor(remainder / 5);
  //     remainder = remainder % 5;
  //     var num1s = remainder;

  //     // print("num25s = " + num25s);
  //     // print("num5s = " + num5s);
  //     // print("num1s = " + num1s);

  //     print("***pos array: " + positionArray);
  //     var stackPos = positionArray.slice();

  //     // Render 25s
  //     for (var i = 0; i < num25s; i++) {
  //       var new25s = getNewCubeSceneObject(chipColors.GREEN);
  //       script.sceneObjects.push(new25s);

  //       stackPos[0] += Math.random() * 0.5 - 0.25;
  //       stackPos[2] += Math.random() * 0.5 - 0.25;

  //       updateBlock(new25s, stackPos, colorArray);
  //       stackPos[1] += 1;
  //       //   script.stackPositions[stackName].push({
  //       //     pos: stackPos,
  //       //     color: "green",
  //       //   });
  //     }
  //     // Render 5s
  //     stackPos = positionArray.slice();
  //     stackPos[0] += GRID_SIZE * 2.1;
  //     for (var i = 0; i < num5s; i++) {
  //       var new5s = getNewCubeSceneObject(chipColors.RED);
  //       script.sceneObjects.push(new5s);
  //       stackPos[0] += Math.random() * 0.5 - 0.25;
  //       stackPos[2] += Math.random() * 0.5 - 0.25;

  //       updateBlock(new5s, stackPos, colorArray);
  //       stackPos[1] += 1;
  //       //   script.stackPositions[stackName].push({
  //       //     pos: stackPos,
  //       //     color: "red",
  //       //   });
  //     }
  //     // Render 1s
  //     stackPos = positionArray.slice();
  //     stackPos[0] += GRID_SIZE * 4.2;
  //     for (var i = 0; i < num1s; i++) {
  //       var new1s = getNewCubeSceneObject(chipColors.WHITE);
  //       script.sceneObjects.push(new1s);
  //       stackPos[0] += Math.random() * 0.5 - 0.25;
  //       stackPos[2] += Math.random() * 0.5 - 0.25;

  //       updateBlock(new1s, stackPos, colorArray);
  //       stackPos[1] += 1;
  //       //   script.stackPositions[stackName].push({
  //       //     pos: stackPos,
  //       //     color: "white",
  //       //   });
  //     }

  //     print(
  //       "script.stackPositions: " + JSON.stringify(script.stackPositions)
  //     );

  //     // *

  //     // return newCube; // ? what do i do w this?
  //   }

  // ----------------------------------------------------------------------------
  function updateBlock(target, positionArray, colorArray) {
    // print("pos array:" + positionArray);
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
  function getNewCubeSceneObject(color) {
    // print("getNewCubeSceneObject()...");
    script.cubeCounter++;

    // for (var x in scene) {
    //   print("***" + x);
    // }
    var cube = scene.createSceneObject("Cube" + script.cubeCounter);
    var cursorMeshVisual = cube.createComponent("Component.MeshVisual");
    cursorMeshVisual.mesh = script.chipMesh;

    cursorMeshVisual.meshShadowMode = 1;
    cursorMeshVisual.clearMaterials();
    switch (color) {
      case chipColors.WHITE:
        cursorMeshVisual.addMaterial(script.chipWhite.clone());
        break;
      case chipColors.RED:
        cursorMeshVisual.addMaterial(script.chipRed.clone());
        break;
      case chipColors.GREEN:
        cursorMeshVisual.addMaterial(script.chipGreen.clone());
        break;
      default:
        cursorMeshVisual.addMaterial(script.chipBlack.clone());
        break;
    }
    // cursorMeshVisual.addMaterial(script.cubeMaterial.clone());

    cube
      .getTransform()
      .setLocalScale(new vec3(GRID_SIZE, GRID_SIZE, GRID_SIZE));

    var newRotation = cube.getTransform().getLocalRotation();
    newRotation.z = 90;
    newRotation.y = 90;
    cube.getTransform().setLocalRotation(newRotation);

    // var newPosition = cube.getTransform().getLocalPosition();
    // newPosition.x += Math.random() - 0.5;
    // newPosition.y += Math.random() - 0.5;
    // newPosition.z += Math.random() - 0.5;
    // // print("new pos:" + newPosition);
    // cube.getTransform().setLocalPosition(newPosition);

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
