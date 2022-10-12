// -----JS CODE-----
//@input Asset.ObjectPrefab objectPrefab

//@input float spawnFrequency{"widget":"slider","min":0.1, "max":5, "step":0.02}
//@input float spawnRandomizer{"widget":"slider","min":0, "max":0.5, "step":0.02}
//@input float spawnRange {"widget":"slider","min":0, "max":1, "step":0.1}
//@input float threshold {"widget":"slider","min":0, "max":0.5, "step":0.01}
//@input float fallingSpeedMin
//@input float fallingSpeedMax

//@input SceneObject mouthPositionObject
//@input Component.Camera camera

//@input SceneObject startButton
//@input SceneObject checkButton
//@input SceneObject betButton

//@input Component.Text currentScoreNumber
//@input Component.Text missedScoreNumber

//@input SceneObject gameOverScreen
//@input float missedScoreMax

// Define Enums
const players = {
  A: "A",
  B: "B",
};
const blinds = {
  LITTLE: 1,
  BIG: 2,
};
const actions = {
  FOLD: "fold",
  CHECK: "check",
  CALL: "call",
  BET: "bet",
};
const rounds = {
  PREFLOP: "preflop",
  FLOP: "flop",
  TURN: "turn",
  RIVER: "river",
};

// Define vars to be updated
var numberOfChecks = 0;
var stacks = {
  A: 100,
  B: 100,
  POT: 0,
};
var currentDealer = players.A;
var currentVillain = players.B;
var currentRound = rounds.PREFLOP;
var currentPlayer = currentDealer;
var nextTurnActions = [actions.FOLD, actions.CALL, actions.BET];
var previousAction = null;
// var playing = true;

// Helper Functions
function endHand(winner) {
  if (winner == players.A) {
    stacks.A += stacks.POT;
  } else {
    stacks.B += stacks.POT;
  }
  stacks.POT = 0;
  currentDealer = getOpponent(currentDealer);
  currentVillain = getOpponent(currentVillain);
  currentRound = rounds.PREFLOP;
  currentPlayer = currentDealer;
  nextTurnActions = [actions.FOLD, actions.CALL, actions.BET];
  previousAction = null;
}

function advanceRound() {
  // Advanced to either FLOP, TURN, or RIVER
  // All which have identical actions/first player to act
  setNextTurnActions(actions.CHECK, actions.BET);
  currentPlayer = currentVillain;

  switch (currentRound) {
    case rounds.PREFLOP:
      currentRound = rounds.FLOP;
      break;
    case rounds.FLOP:
      currentRound = rounds.TURN;
      break;
    case rounds.TURN:
      currentRound = rounds.RIVER;
      break;
    case rounds.RIVER:
      showdown();
      break;
    default:
      console.log("error - shouldnt get here");
  }
}

function showdown() {
  print("Showdown! Who has the winner?");

  // todo - collect user input
  var winner = players.A;
  endHand(winner);
}

function betsAmount(player, amount) {
  // assert(stacks[player] >= amount);
  // todo - check they have enough money

  stacks[player] -= amount;
  stacks.POT += amount;
}

function getOpponent(player) {
  return player == players.A ? players.B : players.A;
}

function setNextTurnActions() {
  nextTurnActions = [];
  for (var x in arguments) {
    print("arg:", x);
    nextTurnActions.push(x);
  }
}

// var print_names = function () {
//   for (var i = 0; i < arguments.length; i++) console.log(arguments[i]);
// };

// * Event Functions *
function onCheck() {
  numberOfChecks++;
  print("Player checked: " + numberOfChecks);

  //   var dealer = currentDealer;
  //   var round = currentRound;
  //   var previousAction = actions.CHECK;
  if (currentRound == rounds.PREFLOP) {
    advanceRound();
  } else if (currentPlayer == currentDealer) {
    advanceRound();
  }
  // Case where villain checks as first action
  else {
    setNextTurnActions(actions.CHECK, actions.BET);
    currentPlayer = getOpponent(currentPlayer);
  }
}

function onFold() {
  var winner = getOpponent(currentPlayer);
  endHand(winner);
}

function onCall() {
  if (previousAction == null) {
    setNextTurnActions(actions.CHECK, actions.BET);
    currentPlayer = getOpponent(currentPlayer);
  } else {
    // todo - subtract chips
    advanceRound();
  }
}

// Includes raising/regular betting
function onBet() {
  // todo - get amount raised
  setNextTurnActions(actions.FOLD, actions.CALL, actions.BET);
  currentPlayer = getOpponent(currentPlayer);
}

// ! end my code

var currentScore = 0;
var nextSpawnTime = 1 / script.spawnFrequency; //reverse spawnFrequency so higher number would produce more frequent result, not necessary for our game but easier to understand.
var spawnRange = script.spawnRange;
var spawnTimer = 0;

//get screen position of this aka ObjectSpawner object
var screenTransform = script
  .getSceneObject()
  .getComponent("Component.ScreenTransform");
var myScreenPos = screenTransform.anchors.getCenter();

var missedScoreMax = script.missedScoreMax;
var missedScore = 0;

var topScore = 0;

//@input Component.Text topScoreNumber
//create reference to global persistent storage system
var store = global.persistentStorageSystem.store;
//create a key to identify the variable to be saved
var scoreKey = "topScore";
//get from saved variable every time lens starts
topScore = store.getInt(scoreKey);
script.topScoreNumber.text = topScore.toString();

script.gameOverScreen.enabled = false;

// ! test
//var tapEvent = script.createEvent("TapEvent")
//tapEvent.bind(function(obj) {
//    var sceneObject = obj.getSceneObject();
//    print("Obj name = " + sceneObject.name);
//    print("Tap position = " + tapEvent.getTapPosition());
//});
// ! end test

script.createEvent("UpdateEvent").bind(function () {
  //    print("call spawner updateevent...")

  if (startgame) {
    getMouthPosition();

    if (spawnTimer < nextSpawnTime) {
      spawnTimer += getDeltaTime();
    } else {
      spawnObject();
      spawnTimer = 0;
      nextSpawnTime =
        1.0 / script.spawnFrequency +
        (Math.random() - 0.5) * script.spawnRandomizer;
    }

    if (missedScore >= missedScoreMax) {
      script.gameOverScreen.enabled = true;
      print("game is over!");
      startgame = false;
    }
  }
});

global.behaviorSystem.addCustomTriggerResponse("START_GAME", startGame);
global.behaviorSystem.addCustomTriggerResponse(
  "PLAYER_CHECKS",
  onCheck
);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_FOLDS", onFold);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_BETS", onBet);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_CALLS", onCall);

var startgame = false;
function startGame() {
  script.startButton.enabled = false;
  script.checkButton.enabled = true;
  script.betButton.enabled = true;

  startgame = true;
}

function spawnObject() {
  //creating a copy of the prefab
  var newObj = script.objectPrefab.instantiate(
    script.getSceneObject().getParent()
  );

  //randomize position with range
  var randomXpos =
    myScreenPos.x + Math.random() * spawnRange * 2 - spawnRange;
  var newObjPosition = new vec2(randomXpos, myScreenPos.y);

  //set screen position of newObj aka ObjectPrefab object
  var objScreenTransform = newObj.getComponent(
    "Component.ScreenTransform"
  );
  objScreenTransform.anchors.setCenter(newObjPosition);
}

function getFallingSpeed() {
  return (
    Math.random() * (script.fallingSpeedMax - script.fallingSpeedMin) +
    script.fallingSpeedMin
  );
}

function getMouthPosition() {
  var mouthWorldPos = script.mouthPositionObject
    .getTransform()
    .getWorldPosition();
  var mouthPos = script.camera.worldSpaceToScreenSpace(mouthWorldPos);
  mouthPos = new vec2(mouthPos.x * 2 - 1, 1 - mouthPos.y * 2);
}

function getThreshold() {
  return script.threshold;
}

function OnHit() {
  if (startgame) {
    currentScore++;
    script.currentScoreNumber.text = currentScore.toString();
    if (currentScore > topScore) {
      //update top score when current score exceeds top score
      topScore = currentScore;
      //store top score in persistent storage
      store.putInt(scoreKey, topScore);
      //update UI
      script.topScoreNumber.text = topScore.toString();
    }
  }
}

function OnMissed() {
  if (startgame) {
    missedScore++;
    script.missedScoreNumber.text = missedScore.toString();
  }
}

script.api.OnMissed = OnMissed;
script.api.OnHit = OnHit;
script.api.getMouthPosition = getMouthPosition;
script.api.getFallingSpeed = getFallingSpeed;
script.api.getThreshold = getThreshold;

script.api.onCheck = onCheck;
