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

// * UI Elements
//@input SceneObject startButton
//@input SceneObject checkButton
//@input SceneObject betButton
//@input SceneObject callButton
//@input SceneObject foldButton
//@input SceneObject nextHandButton
//@input SceneObject AWinsButton
//@input SceneObject BWinsButton

//@input Component.Text stackANumber
//@input Component.Text stackBNumber
//@input Component.Text potNumber
//@input Component.Text currentRound
//@input Component.Text currentPlayer
//@input Component.Text currentDealer
//@input Component.Text amountToCall
//@input Component.Text gameMessage

//@input SceneObject gameOverScreen
//@input float missedScoreMax

// *************** test 2p
// @input Component.ScriptComponent connectedController
// @input Component.ScriptComponent packets
var packets = script.packets.api;
var utils = global.utils;

// Create event system
var events = new utils.Events();
script.api.events = events;

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

// State cache
var cache = {
  stacks: {
    A: 100,
    B: 100,
    POT: 0,
  },
  currentDealer: players.A,
  currentVillain: players.B,
  currentRound: rounds.PREFLOP,
  currentPlayer: players.A,
  nextTurnActions: [actions.FOLD, actions.CALL, actions.BET],
  previousAction: null,
  amountToCall: 0,
  gameMessage: "",
};

// * Working - response to check
// script.api.apiOnCheck = function () {
//   print("apiOnCheck");
//   packets.sendObject("/poker/apiOnCheck/", {
//     msg: { hello: "hello world I checked" },
//   });
// };
packets.on("/poker/apiOnCheck/", function (body, params, userId) {
  //   print("recieved /poker/test/. Body: ", body);
  //   var message = JSON.parse(body);
  events.trigger("respondToCheck");
});

events.on("respondToCheck", function () {
  print("msgStr in events.on:");

  // set player a's stack to 999
  cache.stacks.A = 999;
  updateUI();
});
// *

// * test - update UI (get players in the same game state)
packets.on("/poker/updateCache/", function (body, params, userId) {
  // print("recieved /poker/test/. Body: ", body);
  var cache = JSON.parse(body);
  events.trigger("updateCache", cache);
});

events.on("updateCache", function (newCache) {
  print("msgStr in events.on:");
  setCache(newCache);
  updateUI();
});
// *

// TODO by Wednesday:
// - START RESEARCH JOURNAL
// - fix directories
// - Clean up code from previous app
// - Code up "x to call" so base functionality works (with raising too)
// - Code up text "x to call"
// - Bet amount to be variable
// -
// TODO later:
// - put all persistent variables in big JSON object and add to
//   connected lens realtime store
// - update vars for both players at every game update
// - get player ID/name of each player, say "waiting for opponent" when
//   its not your turn

// @input Component.ScriptComponent connectedController
// @input Component.ScriptComponent packets

// ! remove?
// var packets = script.packets.api;
// var utils = global.utils;
// var log = utils.makeLogger("BlockSync");

// var broadcastValue = packets.makeBroadcastValue("/poker/", userId);
// // Receive other player's broadcasts
// broadcastValue.on(function (cache, params, userId) {});
// !

// To be used to send game data to opponent
function getCache() {
  return cache;
  //   {
  //     stacks: stacks,
  //     currentDealer: currentDealer,
  //     currentVillain: currentVillain,
  //     currentRound: currentRound,
  //     currentPlayer: currentPlayer,
  //     nextTurnActions: nextTurnActions,
  //     previousAction: previousAction,
  //     amountToCall: amountToCall,
  //     gameMessage: gameMessage,
  //   };
}
function setCache(newCache) {
  cache = newCache;
}

// Define vars to be updated
// var stacks = {
//   A: 100,
//   B: 100,
//   POT: 0,
// };
// var currentDealer = players.A;
// var currentVillain = players.B;
// var currentRound = rounds.PREFLOP;
// var currentPlayer = currentDealer;
// var nextTurnActions = [actions.FOLD, actions.CALL, actions.BET];
// var previousAction = null;
// var amountToCall = 0;
// var gameMessage = "";

// Helper Functions
function endHand(winner) {
  if (winner == players.A) {
    cache.stacks.A += cache.stacks.POT;
    cache.gameMessage += " Player A wins $" + cache.stacks.POT + ".";
  } else {
    cache.stacks.B += cache.stacks.POT;
    cache.gameMessage += " Player B wins $" + cache.stacks.POT + ".";
  }
  cache.stacks.POT = 0;
  cache.currentDealer = getOpponent(cache.currentDealer);
  cache.currentVillain = getOpponent(cache.currentVillain);
  cache.currentRound = rounds.PREFLOP;
  cache.currentPlayer = cache.currentDealer;
  cache.nextTurnActions = [actions.FOLD, actions.CALL, actions.BET];
  cache.previousAction = null;
  cache.amountToCall = 0;

  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;
  script.nextHandButton.enabled = true;
  script.AWinsButton.enabled = false;
  script.BWinsButton.enabled = false;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();

  cache.gameMessage = "";
}

function advanceRound() {
  // Advanced to either FLOP, TURN, or RIVER
  // All which have identical actions/first player to act
  setNextTurnActions(actions.CHECK, actions.BET);
  cache.currentPlayer = cache.currentVillain;
  cache.amountToCall = 0;

  switch (cache.currentRound) {
    case rounds.PREFLOP:
      cache.currentRound = rounds.FLOP;
      print("Advanced to Flop.");
      cache.gameMessage += " Deal the Flop.";
      break;
    case rounds.FLOP:
      cache.currentRound = rounds.TURN;
      print("Advanced to Turn.");
      cache.gameMessage += " Deal the Turn.";

      break;
    case rounds.TURN:
      cache.currentRound = rounds.RIVER;
      print("Advanced to River.");
      cache.gameMessage += " Deal the River.";

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
  cache.gameMessage = "Showdown!\n Select the winner.";
  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;
  script.nextHandButton.enabled = false;
  script.AWinsButton.enabled = true;
  script.BWinsButton.enabled = true;
}

function betsAmount(player, amount) {
  // assert(cache.stacks[player] >= amount);
  // todo - check they have enough money

  cache.stacks[player] -= amount;
  cache.stacks.POT += amount;
}

function getOpponent(player) {
  return player == players.A ? players.B : players.A;
}

function setNextTurnActions() {
  cache.nextTurnActions = [];
  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;

  for (var i in arguments) {
    var action = arguments[i];
    cache.nextTurnActions.push(action);

    switch (action) {
      case actions.BET:
        script.betButton.enabled = true;
        break;
      case actions.CALL:
        script.callButton.enabled = true;
        break;
      case actions.CHECK:
        script.checkButton.enabled = true;
        break;
      case actions.FOLD:
        script.foldButton.enabled = true;
        break;
    }
  }
}

function updateUI() {
  script.stackANumber.text = cache.stacks.A.toString();
  script.stackBNumber.text = cache.stacks.B.toString();
  script.potNumber.text = cache.stacks.POT.toString();
  script.currentRound.text = cache.currentRound;
  script.currentPlayer.text = cache.currentPlayer;
  script.currentDealer.text = cache.currentDealer;
  script.amountToCall.text = cache.amountToCall.toString();
  script.gameMessage.text = cache.gameMessage;
}

function payBlinds() {
  print(
    "Paying blinds. Player " +
      cache.currentDealer +
      " is Little Blind and player " +
      cache.currentVillain +
      " is Big Blind."
  );

  // Dealer is Little, Villain is Big
  betsAmount(cache.currentDealer, blinds.LITTLE);

  // Big blind is villain
  betsAmount(cache.currentVillain, blinds.BIG);

  cache.amountToCall = blinds.BIG - blinds.LITTLE;
}

// var print_names = function () {
//   for (var i = 0; i < arguments.length; i++) console.log(arguments[i]);
// };

// * Event Functions *
function onCheck() {
  //  packets.sendObject("/poker/apiOnCheck/", {
  //    msg: { hello: "hello world I checked (1)" },
  //  });
  //   packets.send("/poker/apiOnCheck/");
  print("Player " + cache.currentPlayer + " checks.");
  cache.gameMessage = "Player " + cache.currentPlayer + " checks.";

  //   numberOfChecks++;
  //   print("Player checked: " + numberOfChecks);

  //   var dealer = currentDealer;
  //   var round = currentRound;
  //   var previousAction = actions.CHECK;
  if (cache.currentRound == rounds.PREFLOP) {
    advanceRound();
  } else if (cache.currentPlayer == cache.currentDealer) {
    advanceRound();
  }
  // Case where villain checks as first action
  else {
    setNextTurnActions(actions.CHECK, actions.BET);
    cache.currentPlayer = getOpponent(cache.currentPlayer);
  }
  cache.previousAction = actions.CHECK;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();
}

function onFold() {
  print("Player " + cache.currentPlayer + " folds.");
  cache.gameMessage = "Player " + cache.currentPlayer + " folds.";

  var winner = getOpponent(cache.currentPlayer);
  endHand(winner);
  cache.previousAction = actions.FOLD;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();
}

function onCall() {
  print("Player " + cache.currentPlayer + " calls.");
  cache.gameMessage = "Player " + cache.currentPlayer + " calls.";

  betsAmount(cache.currentPlayer, cache.amountToCall);
  cache.amountToCall = 0;

  if (cache.previousAction == null) {
    setNextTurnActions(actions.CHECK, actions.BET);
    cache.currentPlayer = getOpponent(cache.currentPlayer);
  } else {
    // todo - subtract chips
    advanceRound();
  }
  cache.previousAction = actions.CALL;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();
}

// Includes raising/regular betting
function onBet() {
  // Launch keyboard and gather input
  global.textInputSystem.requestKeyboard(options);

  //   var betAmount = 0;
}

// * Keyboard
var options = new TextInputSystem.KeyboardOptions();
options.enablePreview = true;
options.keyboardType = TextInputSystem.KeyboardType.Text;
options.returnKeyType = TextInputSystem.ReturnKeyType.Done;

// Maintain the state of the keyboard
var currText = "";
options.onTextChanged = function (text, range) {
  currText = text;
};

// When the keyboard returns, print the current text
options.onKeyboardStateChanged = function (isOpen) {
  if (!isOpen) {
    var betAmount = parseInt(currText);
    resolveOnBet(betAmount);
  }
};

function resolveOnBet(betAmount) {
  print("Player " + cache.currentPlayer + " bets $" + betAmount + ".");
  cache.gameMessage =
    "Player " + cache.currentPlayer + " bets $" + betAmount + ".";

  print("Bet amount: " + betAmount);

  print("onBet called...");

  // todo - get amount raised
  //   var betAmount = 5;
  betsAmount(cache.currentPlayer, betAmount);
  cache.amountToCall = betAmount - cache.amountToCall;

  setNextTurnActions(actions.FOLD, actions.CALL, actions.BET);
  cache.currentPlayer = getOpponent(cache.currentPlayer);
  cache.previousAction = actions.BET;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();
}

// function getPromiseFromEvent(item, event) {
//   return new Promise((resolve) => {
//     const listener = () => {
//       item.removeEventListener(event, listener);
//       resolve();
//     };
//     item.addEventListener(event, listener);
//   });
// }

// async function waitForButtonClick() {
//   const div = document.querySelector("div");
//   const button = document.querySelector("button");
//   div.innerText = "Waiting for you to press the button";
//   await getPromiseFromEvent(button, "keyboardStateChanged");
//   div.innerText = "The button was pressed!";
// }

function onAWins() {
  print("Player A Wins!");
  endHand(players.A);
}
function onBWins() {
  print("Player B Wins!");
  endHand(players.B);
}

// ! end my code

// var currentScore = 0;
// var nextSpawnTime = 1 / script.spawnFrequency; //reverse spawnFrequency so higher number would produce more frequent result, not necessary for our game but easier to understand.
// var spawnRange = script.spawnRange;
// var spawnTimer = 0;

// //get screen position of this aka ObjectSpawner object
// var screenTransform = script
//   .getSceneObject()
//   .getComponent("Component.ScreenTransform");
// var myScreenPos = screenTransform.anchors.getCenter();

// var missedScoreMax = script.missedScoreMax;
// var missedScore = 0;

// var topScore = 0;

// //@input Component.Text topScoreNumber
// //create reference to global persistent storage system
// var store = global.persistentStorageSystem.store;
// //create a key to identify the variable to be saved
// var scoreKey = "topScore";
// //get from saved variable every time lens starts
// topScore = store.getInt(scoreKey);
// script.topScoreNumber.text = topScore.toString();

// * use?
// script.gameOverScreen.enabled = false;

// ! test
//var tapEvent = script.createEvent("TapEvent")
//tapEvent.bind(function(obj) {
//    var sceneObject = obj.getSceneObject();
//    print("Obj name = " + sceneObject.name);
//    print("Tap position = " + tapEvent.getTapPosition());
//});
// ! end test

// script.createEvent("UpdateEvent").bind(function () {
//   //    print("call spawner updateevent...")

//   if (startgame) {
//     getMouthPosition();

//     if (spawnTimer < nextSpawnTime) {
//       spawnTimer += getDeltaTime();
//     } else {
//       spawnObject();
//       spawnTimer = 0;
//       nextSpawnTime =
//         1.0 / script.spawnFrequency +
//         (Math.random() - 0.5) * script.spawnRandomizer;
//     }

//     if (missedScore >= missedScoreMax) {
//       script.gameOverScreen.enabled = true;
//       print("game is over!");
//       startgame = false;
//     }
//   }
// });

global.behaviorSystem.addCustomTriggerResponse(
  "START_GAME",
  onStartGame
);
global.behaviorSystem.addCustomTriggerResponse(
  "PLAYER_CHECKS",
  onCheck
);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_FOLDS", onFold);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_BETS", onBet);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_CALLS", onCall);

global.behaviorSystem.addCustomTriggerResponse("NEXT_HAND", onNextHand);
global.behaviorSystem.addCustomTriggerResponse("A_WINS", onAWins);
global.behaviorSystem.addCustomTriggerResponse("B_WINS", onBWins);

// var startgame = false;
function onStartGame() {
  print("Game started.");
  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = true;
  script.callButton.enabled = true;
  script.foldButton.enabled = true;
  script.nextHandButton.enabled = false;
  script.AWinsButton.enabled = false;
  script.BWinsButton.enabled = false;

  // Start first hand
  onNextHand();

  //   startgame = true;
}

function onNextHand() {
  print("Hand started.");
  // Pay blinds
  payBlinds();

  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = true;
  script.callButton.enabled = true;
  script.foldButton.enabled = true;
  script.nextHandButton.enabled = false;
  script.AWinsButton.enabled = false;
  script.BWinsButton.enabled = false;

  packets.sendObject("/poker/updateCache/", cache);
  updateUI();
}

// // Maintain the state of the keyboard
// options.onTextChanged = function (text, range) {
//   currText = text;
// };

// // When the keyboard returns, print the current text
// options.onKeyboardStateChanged = function (isOpen) {
//   if (!isOpen) {
//     print(currText);
//   }
// };

// script.createEvent("TapEvent").bind(function () {
//   global.textInputSystem.requestKeyboard(options);
// });
// *

// function spawnObject() {
//   //creating a copy of the prefab
//   var newObj = script.objectPrefab.instantiate(
//     script.getSceneObject().getParent()
//   );

//   //randomize position with range
//   var randomXpos =
//     myScreenPos.x + Math.random() * spawnRange * 2 - spawnRange;
//   var newObjPosition = new vec2(randomXpos, myScreenPos.y);

//   //set screen position of newObj aka ObjectPrefab object
//   var objScreenTransform = newObj.getComponent(
//     "Component.ScreenTransform"
//   );
//   objScreenTransform.anchors.setCenter(newObjPosition);
// }

// function getFallingSpeed() {
//   return (
//     Math.random() * (script.fallingSpeedMax - script.fallingSpeedMin) +
//     script.fallingSpeedMin
//   );
// }

// function getMouthPosition() {
//   var mouthWorldPos = script.mouthPositionObject
//     .getTransform()
//     .getWorldPosition();
//   var mouthPos = script.camera.worldSpaceToScreenSpace(mouthWorldPos);
//   mouthPos = new vec2(mouthPos.x * 2 - 1, 1 - mouthPos.y * 2);
// }

// function getThreshold() {
//   return script.threshold;
// }

// function OnHit() {
//   if (startgame) {
//     currentScore++;
//     script.currentScoreNumber.text = currentScore.toString();
//     if (currentScore > topScore) {
//       //update top score when current score exceeds top score
//       topScore = currentScore;
//       //store top score in persistent storage
//       store.putInt(scoreKey, topScore);
//       //update UI
//       script.topScoreNumber.text = topScore.toString();
//     }
//   }
// }

// function OnMissed() {
//   if (startgame) {
//     missedScore++;
//     script.missedScoreNumber.text = missedScore.toString();
//   }
// }

// script.api.OnMissed = OnMissed;
// script.api.OnHit = OnHit;
// script.api.getMouthPosition = getMouthPosition;
// script.api.getFallingSpeed = getFallingSpeed;
// script.api.getThreshold = getThreshold;

// script.api.onCheck = onCheck; // ?
