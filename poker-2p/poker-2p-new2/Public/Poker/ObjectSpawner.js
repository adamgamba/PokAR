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

//@input SceneObject startGameScreen
//@input SceneObject startGameScreenHolder

// * UI Elements
//@input SceneObject startButton
//@input SceneObject checkButton
//@input SceneObject betButton
//@input SceneObject raiseButton
//@input SceneObject callButton
//@input SceneObject foldButton
//@input SceneObject nextHandButton
//@input SceneObject AWinsButton
//@input SceneObject BWinsButton

//@input SceneObject ModeSelectButton1
//@input SceneObject ModeSelectButton2
//@input SceneObject ModeSelectScreen

//@input Component.Text stackANumber
//@input Component.Text stackBNumber
//@input Component.Text potNumber
//@input Component.Text currentRound
//@input Component.Text currentPlayer
//@input Component.Text currentDealer
//@input Component.Text amountToCall
//@input Component.Text gameMessage
//@input Component.Text waitingMessage
//@input Component.Text handNumber
//@input Component.Text dealerMessage
//@input Component.Text allInMessage

//@input SceneObject stackANumberObj
//@input SceneObject stackBNumberObj
//@input SceneObject potNumberObj
//@input SceneObject currentRoundObj
//@input SceneObject currentPlayerObj
//@input SceneObject currentDealerObj
//@input SceneObject amountToCallObj
//@input SceneObject gameMessageObj
//@input SceneObject waitingMessageObj
//@input SceneObject handNumberObj
//@input SceneObject dealerMessageObj
//@input SceneObject allInMessageObj

//@input SceneObject gameOverScreen
//@input float missedScoreMax

// *************** test 2p
// @input Component.ScriptComponent connectedController
// @input Component.ScriptComponent packets
// @input Component.ScriptComponent chipDrawing
//@input int numStacksPlaced

var packets = script.packets.api;
var chipDrawing = script.chipDrawing.api;

var utils = global.utils;

// Create event system
var events = new utils.Events();
script.api.events = events;

// script.startGameScreen.enabled = false;

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
  RAISE: "raise",
};
const rounds = {
  PREFLOP: "Preflop",
  FLOP: "Flop",
  TURN: "Turn",
  RIVER: "River",
};

// State cache
var sharedCache = {
  stacks: {
    A: 100,
    B: 100,
    POT: 0,
  },
  currentDealer: players.A,
  currentVillain: players.B,
  currentRound: rounds.PREFLOP,
  currentPlayer: players.A,
  nextTurnActions: [actions.FOLD, actions.CALL, actions.BET], // !
  previousAction: null,
  previousPlayer: null,
  amountToCall: 0,
  hostId: "",
  previousBetAmount: 0,
  stackPositions: {
    A: [],
    B: [],
    POT: [],
  },
  handNumber: 1,
  winner: null,
  dealerMessage: "", // ! testing
  isAllIn: false, // ! testing
  isShowdown: false,
};

var localCache = {
  playerName: "",
  isHost: true,
  myAction: true,
  gameMessage: "",
  isDealer: true,
};

// Update UI (get players in the same game state)
packets.on(
  "/poker/updateSharedCache/",
  function (body, params, userId) {
    // print("recieved /poker/test/. Body: ", body);
    var cache = JSON.parse(body);
    events.trigger("updateSharedCache", cache, userId);
  }
);

events.on("updateSharedCache", function (newCache, userId) {
  setCache(newCache); // Update shared cache
  updateUI();
  return;

  // Update local cache (game message)
  if (newCache.winner != null) {
    if (newCache.winner == localCache.playerName) {
      localCache.gameMessage =
        "I win $" + sharedCache.stacks.POT.toString();
    } else {
      localCache.gameMessage =
        "Opponent wins $" + sharedCache.stacks.POT.toString();
    }

    updateUI();
    return;
  }

  //   // * test
  //   if (localCache.gameMessage.includes("Deal")) {
  //     // localCache.gameMessage ;
  //     updateUI();
  //     return;
  //   }
  //   // * end test

  var playerStr =
    newCache.previousPlayer == localCache.playerName
      ? "I "
      : "Opponent ";

  var actionStr = "";
  switch (newCache.previousAction) {
    case null:
      //   action = "null !!!";
      //   if (newCache.currentPlayer == localCache.playerName) {
      //     action += "s";
      //   }
      //   action += "."
      break;
    case actions.FOLD:
      actionStr = "fold";
      if (newCache.previousPlayer != localCache.playerName) {
        actionStr += "s";
      }
      break;
    case actions.CHECK:
      actionStr = "check";
      if (newCache.previousPlayer != localCache.playerName) {
        actionStr += "s";
      }
      break;
    case actions.CALL:
      actionStr = "call";
      if (newCache.previousPlayer != localCache.playerName) {
        actionStr += "s";
      }
      break;
    case actions.BET:
      if (newCache.previousPlayer == localCache.playerName) {
        actionStr = "bet";
      } else {
        actionStr = "bets";
      }
      actionStr += " $" + newCache.previousBetAmount.toString();
      break;
    case actions.RAISE:
      if (newCache.previousPlayer == localCache.playerName) {
        actionStr = "raise to";
      } else {
        actionStr = "raises to";
      }
      actionStr += " $" + newCache.previousBetAmount.toString();
      break;
  }
  actionStr += ". ";

  if (newCache.previousAction != null) {
    localCache.gameMessage += playerStr + actionStr;
  }

  updateUI();
});

// ---
packets.on("/poker/startGame/", function (body, params, userId) {
  events.trigger("startGame", userId);
  packets.sendObject("/poker/updateSharedCache/", sharedCache);
});

// Message to be received ONCE by non-host player
events.on("startGame", function (userId) {
  sharedCache.hostId = userId;

  localCache.isHost = false;
  localCache.isDealer = false;
  localCache.playerName = players.B;
  onStartGame();
});
// ---
packets.on(
  "/poker/setNextTurnActions/",
  function (body, params, userId) {
    var actions = JSON.parse(body);
    events.trigger("setNextTurnActions", actions);
  }
);

events.on("setNextTurnActions", function (actions) {
  setNextTurnActions(actions);
});
// ---
packets.on("/poker/showdown/", function (body, params, userId) {
  events.trigger("showdown");
});

events.on("showdown", function () {
  sharedCache.isShowdown = true;
  showdown();
});
// ---
packets.on("/poker/endHand/", function (body, params, userId) {
  var nextDealer = JSON.parse(body).nextDealer;
  events.trigger("endHand", nextDealer);
});

events.on("endHand", function (nextDealer) {
  endHand(nextDealer);
});
// ---
packets.on("/poker/nextHand/", function (body, params, userId) {
  events.trigger("nextHand");
});

events.on("nextHand", function () {
  onNextHand();
});
// ---

// * 3D Text Objects
//@input Component.Text3D textStackAFacingA
//@input Component.Text3D textStackBFacingA
//@input Component.Text3D textStackPotFacingA
//@input Component.Text3D textStackAFacingB
//@input Component.Text3D textStackBFacingB
//@input Component.Text3D textStackPotFacingB

script.textStackAFacingA.enabled = false;
script.textStackBFacingA.enabled = false;
script.textStackPotFacingA.enabled = false;
script.textStackAFacingB.enabled = false;
script.textStackBFacingB.enabled = false;
script.textStackPotFacingB.enabled = false;

// @input Component.ScriptComponent connectedController
// @input Component.ScriptComponent packets

// To be used to send game data to opponent
function getCache() {
  return sharedCache;
}
function setCache(newCache) {
  sharedCache = newCache;
}

// * Helper Functions

// Reset caches
function advanceCache() {
  //   sharedCache.previousPlayer = sharedCache.currentPlayer;

  sharedCache.stacks.POT = 0;
  sharedCache.currentDealer = getOpponent(sharedCache.currentDealer);
  sharedCache.currentVillain = getOpponent(sharedCache.currentVillain);
  sharedCache.currentRound = rounds.PREFLOP;
  sharedCache.currentPlayer = sharedCache.currentDealer;
  sharedCache.nextTurnActions = [
    actions.FOLD,
    actions.CALL,
    actions.BET,
  ];
  sharedCache.previousAction = null;
  sharedCache.amountToCall = 0;
  sharedCache.previousBetAmount = 0;
  localCache.gameMessage = "";
  sharedCache.winner = null;
  sharedCache.dealerMessage = "";
  sharedCache.isAllIn = false;
  sharedCache.isShowdown = false;

  return sharedCache.currentDealer;
}

// End hand
function endHand(nextDealer) {
  sharedCache.isShowdown = false;

  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.raiseButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;
  script.nextHandButton.enabled = false;
  script.AWinsButton.enabled = false;
  script.BWinsButton.enabled = false;

  if (localCache.playerName == nextDealer) {
    localCache.isDealer = true;

    // localCache.gameMessage =
    //   "You are the dealer. Deal two cards to each player.";
    script.nextHandButton.enabled = true;
    script.waitingMessage.text = "";
  } else {
    localCache.isDealer = false;
    script.nextHandButton.enabled = false;
    script.waitingMessage.text = "Waiting for opponent...";
  }

  //   packets.sendObject("/poker/updateSharedCache/", sharedCache);
  //   updateUI();
}

// Pay out to winner - Only do this once
function payoutWinner(winner) {
  if (winner == players.A) {
    sharedCache.stacks.A += sharedCache.stacks.POT;
  } else {
    sharedCache.stacks.B += sharedCache.stacks.POT;
  }

  //   if (winner == localCache.playerName) {
  //     localCache.gameMessage += " I win $" + sharedCache.stacks.POT + ".";
  //   } else {
  //     localCache.gameMessage +=
  //       " Opponent wins $" + sharedCache.stacks.POT + ".";
  //   }

  // [winnerName, amount]
  sharedCache.winner = [winner, sharedCache.stacks.POT];

  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}

function advanceRound() {
  // Advanced to either FLOP, TURN, or RIVER
  // All which have identical actions/first player to act
  sharedCache.currentPlayer = sharedCache.currentVillain;
  sharedCache.amountToCall = 0;
  sharedCache.previousBetAmount = 0;

  switch (sharedCache.currentRound) {
    case rounds.PREFLOP:
      sharedCache.currentRound = rounds.FLOP;
      print("Advanced to Flop.");
      sharedCache.dealerMessage = "Deal the Flop.";
      //   if (localCache.isDealer) {
      // localCache.gameMessage += " Deal the Flop.";
      //   }
      break;
    case rounds.FLOP:
      sharedCache.currentRound = rounds.TURN;
      print("Advanced to Turn.");
      sharedCache.dealerMessage = "Deal the Turn.";
      //   if (localCache.isDealer) {
      // localCache.gameMessage += " Deal the Turn.";
      //   }

      break;
    case rounds.TURN:
      sharedCache.currentRound = rounds.RIVER;
      print("Advanced to River.");
      sharedCache.dealerMessage = "Deal the River.";
      //   if (localCache.isDealer) {
      // localCache.gameMessage += " Deal the River.";
      //   }

      break;
    case rounds.RIVER:
      packets.send("/poker/showdown/");

      sharedCache.isShowdown = true;
      showdown();
      break;
    default:
      console.log("error - shouldnt get here");
  }
}

function showdown() {
  print("Showdown! Who has the winner?");
  //   localCache.gameMessage = "Showdown! Select the winner.";
  script.waitingMessage.text = "";
  // Enable correct UI elements
  script.startButton.enabled = false;
  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.raiseButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;
  script.nextHandButton.enabled = false;
  script.AWinsButton.enabled = true;
  script.BWinsButton.enabled = true;

  //   sharedCache.isShowdown = false;
}

function betsAmount(player, amount) {
  sharedCache.stacks[player] -= amount;
  sharedCache.stacks.POT += amount;
}

function getOpponent(player) {
  return player == players.A ? players.B : players.A;
}

function setNextTurnActions(allowedActions) {
  //   packets.sendObject("/poker/updateSharedCache/", sharedCache);

  // Only renders buttons for player who currently has action
  localCache.myAction =
    localCache.playerName == sharedCache.currentPlayer;

  sharedCache.nextTurnActions = [];

  script.checkButton.enabled = false;
  script.betButton.enabled = false;
  script.raiseButton.enabled = false;
  script.callButton.enabled = false;
  script.foldButton.enabled = false;

  for (var i in allowedActions) {
    var allowedAction = allowedActions[i];
    sharedCache.nextTurnActions.push(allowedAction);
  }

  if (!localCache.myAction) {
    packets.sendObject(
      "/poker/setNextTurnActions/",
      sharedCache.nextTurnActions
    );

    script.waitingMessage.text = "Waiting for opponent...";
    return;
  }
  script.waitingMessage.text = "";

  for (var j in allowedActions) {
    var action = allowedActions[j];
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
      case actions.RAISE:
        script.raiseButton.enabled = true;
        break;
    }
  }
  //   updateUI();
}

function updateUI() {
  script.stackANumber.text = sharedCache.stacks.A.toString();
  script.stackBNumber.text = sharedCache.stacks.B.toString();
  script.potNumber.text = sharedCache.stacks.POT.toString();
  script.currentRound.text = sharedCache.currentRound;
  script.currentPlayer.text =
    sharedCache.currentPlayer == localCache.playerName
      ? "Me"
      : "Opponent";
  script.currentDealer.text =
    sharedCache.currentDealer == localCache.playerName
      ? "Me"
      : "Opponent";

  //  * temp comment out
  if (
    sharedCache.amountToCall == 0 ||
    sharedCache.currentPlayer != localCache.playerName
  ) {
    script.amountToCallObj.enabled = false;
  } else {
    script.amountToCallObj.enabled = true;
    script.amountToCall.text = sharedCache.amountToCall.toString();
  }

  // TODO: Build Game Message
  if (sharedCache.previousAction != null) {
    var gameMsg = "";
    if (sharedCache.isAllIn && sharedCache.previousBetAmount > 0) {
      if (sharedCache.previousPlayer == localCache.playerName) {
        gameMsg =
          "I'm All-In for $" +
          sharedCache.previousBetAmount.toString() +
          ".";
      } else {
        gameMsg =
          "Opponent is All-In for $" +
          sharedCache.previousBetAmount.toString() +
          ".";
      }
    } else {
      gameMsg +=
        sharedCache.previousPlayer == localCache.playerName
          ? "I "
          : "Opponent ";

      gameMsg += sharedCache.previousAction;
      if (sharedCache.previousPlayer != localCache.playerName) {
        gameMsg += "s";
      }

      if (
        sharedCache.previousAction == "bet" ||
        sharedCache.previousAction == "raise"
      ) {
        // var playerIsAllIn = stacks[sharedCache.previousPlayer] == 0;

        // if (playerIsAllIn) {
        //     gameMsg +=
        // }

        gameMsg += " $" + sharedCache.previousBetAmount.toString();
      }

      gameMsg += ".";
    }
    script.gameMessage.text = gameMsg;
  } else {
    script.gameMessage.text = "";
  }
  //   localCache.gameMessage;
  //   localCache.gameMessage = "";
  script.handNumber.text = sharedCache.handNumber.toString();

  if (sharedCache.isShowdown) {
    script.dealerMessage.text = "Showdown! Select the winner.";
    script.waitingMessage.text = "";
    // TODO - add option to chop
  } else {
    script.dealerMessage.text = sharedCache.dealerMessage;
  }

  //   script.allInMessage.text = sharedCache.isAllIn ? "ALL IN!!!" : "";

  print("rendering chip stacks...");
  print("stack = " + script.stackANumber.text);
  print("stack = " + script.stackBNumber.text);
  print("stack = " + script.potNumber.text);
  chipDrawing.renderChipStacks();
}

function payBlinds() {
  print(
    "Paying blinds. Player " +
      sharedCache.currentDealer +
      " is Little Blind and player " +
      sharedCache.currentVillain +
      " is Big Blind."
  );

  // Dealer is Little, Villain is Big
  betsAmount(sharedCache.currentDealer, blinds.LITTLE);

  // Big blind is villain
  betsAmount(sharedCache.currentVillain, blinds.BIG);

  sharedCache.amountToCall = blinds.BIG - blinds.LITTLE;
  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}

// * Event Functions
function onCheck() {
  sharedCache.previousPlayer = sharedCache.currentPlayer;
  sharedCache.dealerMessage = "";
  sharedCache.isShowdown = false;

  //   if (sharedCache.currentPlayer == localCache.playerName) {
  //     localCache.gameMessage = "I check. (oncheck)";
  //   }

  // Case where villain checks option
  if (sharedCache.currentRound == rounds.PREFLOP) {
    advanceRound();
  }
  // Case where dealer checks postflop
  else if (sharedCache.currentPlayer == sharedCache.currentDealer) {
    advanceRound();
  }
  // Case where villain checks as first action
  else {
    sharedCache.currentPlayer = getOpponent(sharedCache.currentPlayer);
    setNextTurnActions([actions.CHECK, actions.BET]);
  }

  sharedCache.previousAction = actions.CHECK;
  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
  //   sharedCache.dealerMessage = "";
}

function onFold() {
  sharedCache.previousPlayer = sharedCache.currentPlayer;
  sharedCache.dealerMessage = "";
  sharedCache.isShowdown = false;

  print("Player " + sharedCache.currentPlayer + " folds.");
  //   sharedCache.gameMessage =
  //     "Player " + sharedCache.currentPlayer + " folds.";
  //   if (sharedCache.currentPlayer == localCache.playerName) {
  //     localCache.gameMessage = "I fold. (onfold)";
  //   }

  var winner = getOpponent(sharedCache.currentPlayer);

  payoutWinner(winner);
  var nextDealer = advanceCache();
  endHand(nextDealer);
  packets.sendObject("/poker/endHand/", { nextDealer: nextDealer });

  sharedCache.previousAction = actions.FOLD;

  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}

function onCall() {
  sharedCache.previousPlayer = sharedCache.currentPlayer;
  sharedCache.dealerMessage = "";
  sharedCache.isShowdown = false;

  print("Player " + sharedCache.currentPlayer + " calls.");
  //   sharedCache.gameMessage =
  //     "Player " + sharedCache.currentPlayer + " calls.";
  //   if (sharedCache.currentPlayer == localCache.playerName) {
  //     localCache.gameMessage = "I call. (oncall)";
  //   }

  if (sharedCache.amountToCall > 0) {
    betsAmount(sharedCache.currentPlayer, sharedCache.amountToCall);
  }

  // Preflop villain option
  if (sharedCache.previousAction == null) {
    sharedCache.currentPlayer = getOpponent(sharedCache.currentPlayer);
    sharedCache.previousBetAmount = sharedCache.amountToCall;
    sharedCache.amountToCall = 0;

    setNextTurnActions([actions.CHECK, actions.RAISE]);
  }
  // Case where dealer calls to close action postflop
  else {
    sharedCache.amountToCall = 0;

    advanceRound();
  }

  sharedCache.previousAction = actions.CALL;

  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}

// onRaise function directly calls onBet (same behavior)
function onRaise() {
  onBet(true);
}

// Includes raising/regular betting
function onBet(isRaising) {
  sharedCache.previousPlayer = sharedCache.currentPlayer;
  sharedCache.dealerMessage = "";
  sharedCache.isShowdown = false;
  sharedCache.previousAction = isRaising ? actions.RAISE : actions.BET;

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
// *

// When the keyboard returns, print the current text
options.onKeyboardStateChanged = function (isOpen) {
  if (!isOpen) {
    var betAmount = parseInt(currText);
    var validBet = true;

    // ! include check for betAmount NaN
    // ! > players behind
    // ! OR < 2x previous bet

    // Allow All-Ins
    if (
      betAmount == sharedCache.stacks[sharedCache.previousPlayer] ||
      betAmount ==
        sharedCache.stacks[getOpponent(sharedCache.previousPlayer)]
    ) {
      sharedCache.isAllIn = true;
      print("Valid bet.");
      resolveOnBet(betAmount);
    }

    // Disallow first bet of < BIG blind
    if (sharedCache.previousBetAmount == 0 && betAmount < blinds.BIG) {
      print("Invalid bet. try again");
      validBet = false;
      return;
    }

    // Disallow raise of < 2x previous bet
    if (
      sharedCache.previousBetAmount > 0 &&
      betAmount < 2 * sharedCache.previousBetAmount
    ) {
      print("Invalid bet. try again");
      validBet = false;
      return;
    }

    // Disallow non numeric bets
    // Disallow bets of more money than the player has
    var currPlayerAmountBehind =
      sharedCache.currentPlayer == players.A
        ? sharedCache.stacks.A
        : sharedCache.stacks.B;

    if (isNaN(betAmount) || betAmount > currPlayerAmountBehind) {
      print("Invalid bet. try again");
      validBet = false;
      return;
    }

    if (validBet) {
      print("Valid bet.");
      resolveOnBet(betAmount);
    }
  }
};

function resolveOnBet(betAmount) {
  sharedCache.previousBetAmount = betAmount;

  print(
    "Player " + sharedCache.currentPlayer + " bets $" + betAmount + "."
  );
  //   sharedCache.gameMessage =
  //     "Player " + sharedCache.currentPlayer + " bets $" + betAmount + ".";
  //   if (sharedCache.currentPlayer == localCache.playerName) {
  //     localCache.gameMessage =
  //       "(onbet) I bet $" + betAmount.toString() + ".";
  //   }

  print("Bet amount: " + betAmount);

  print("onBet called...");

  // todo - get amount raised
  //   var betAmount = 5;
  betsAmount(sharedCache.currentPlayer, betAmount);
  sharedCache.amountToCall = betAmount - sharedCache.amountToCall;

  sharedCache.currentPlayer = getOpponent(sharedCache.currentPlayer);
  //   sharedCache.previousAction = actions.BET;
  setNextTurnActions([actions.FOLD, actions.CALL, actions.RAISE]);

  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}

function onAWins() {
  print("Player A Wins!");

  //   if (players.A == localCache.playerName) {
  //     localCache.gameMessage =
  //       "I win $" + sharedCache.stacks.POT.toString();
  //   } else {
  //     localCache.gameMessage =
  //       "Opponent wins $" + sharedCache.stacks.POT.toString();
  //   }

  payoutWinner(players.A);
  var nextDealer = advanceCache();
  endHand(nextDealer);
  setNextTurnActions([actions.CHECK, actions.BET]);

  packets.sendObject("/poker/endHand/", { nextDealer: nextDealer });

  updateUI();
  packets.sendObject("/poker/updateSharedCache/", sharedCache);
}
function onBWins() {
  print("Player B Wins!");

  //   if (players.B == localCache.playerName) {
  //     localCache.gameMessage =
  //       "I win $" + sharedCache.stacks.POT.toString();
  //   } else {
  //     localCache.gameMessage =
  //       "Opponent wins $" + sharedCache.stacks.POT.toString();
  //   }

  payoutWinner(players.B);
  var nextDealer = advanceCache();
  endHand(nextDealer);
  setNextTurnActions([actions.CHECK, actions.BET]);

  packets.sendObject("/poker/endHand/", { nextDealer: nextDealer });

  updateUI();
  packets.sendObject("/poker/updateSharedCache/", sharedCache);
}

// * Behavior
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
global.behaviorSystem.addCustomTriggerResponse(
  "PLAYER_RAISES",
  onRaise
);
global.behaviorSystem.addCustomTriggerResponse("PLAYER_CALLS", onCall);

global.behaviorSystem.addCustomTriggerResponse("NEXT_HAND", onNextHand);
global.behaviorSystem.addCustomTriggerResponse("A_WINS", onAWins);
global.behaviorSystem.addCustomTriggerResponse("B_WINS", onBWins);
script.startGameScreen.enabled = false;
script.startGameScreenHolder.enabled = false;

// function onStartRemote() {
//   print("Game started remotely.");
//   script.ModeSelectButton1.enabled = false;
//   script.ModeSelectButton2.enabled = false;
//   script.ModeSelectScreen.enabled = false;

//   print("***num stacks placed = " + script.numStacksPlaced);

//   if (parseInt(script.numStacksPlaced.text) < 3) {
//     print("startgamescreen disabled...");
//     script.startGameScreen.enabled = false;
//     script.startGameScreenHolder.enabled = false;
//   } else {
//     print("startgamescreen enabled...");
//     script.startGameScreen.enabled = true;
//     script.startGameScreenHolder.enabled = true;
//   }

//   script.startGameScreen.enabled = true;
//   script.startGameScreenHolder.enabled = true;
//   //   script.stackANumberObj.enabled = true;
// }
// script.api.onStartRemote = onStartRemote;

// function onStartColocated() {
//   print("Game started colocated.");
//   script.ModeSelectButton1.enabled = false;
//   script.ModeSelectButton2.enabled = false;
//   script.ModeSelectScreen.enabled = false;
//   script.startGameScreen.enabled = true;
//   script.startGameScreenHolder.enabled = true;
// }

// Starts the game for both players

function onStartGame() {
  print("Game started.");

  script.startGameScreen.enabled = false;
  script.startGameScreenHolder.enabled = false;

  script.stackANumberObj.enabled = false;
  script.stackBNumberObj.enabled = false;
  script.potNumberObj.enabled = false;
  script.currentRoundObj.enabled = true;
  script.currentPlayerObj.enabled = false;
  script.currentDealerObj.enabled = true;
  script.amountToCallObj.enabled = true;
  script.gameMessageObj.enabled = true;
  script.waitingMessageObj.enabled = true;
  script.handNumberObj.enabled = true;
  script.dealerMessageObj.enabled = true;
  script.allInMessageObj.enabled = false;

  // Only do this once (use player A for consistency)
  if (localCache.playerName != players.B) {
    packets.send("/poker/startGame/");

    // Current player becomes to host (Player A)
    // Send start message to other player
    localCache.isHost = true;
    localCache.playerName = players.A;

    // Enable correct UI elements
    script.startButton.enabled = false;
    script.checkButton.enabled = false;
    script.betButton.enabled = true;
    script.raiseButton.enabled = false;
    script.callButton.enabled = true;
    script.foldButton.enabled = true;
    script.nextHandButton.enabled = false;
    script.AWinsButton.enabled = false;
    script.BWinsButton.enabled = false;
    script.waitingMessage.text = "";

    // Enable correct 3D text elements
    script.textStackAFacingA.enabled = true;
    script.textStackBFacingA.enabled = true;
    script.textStackPotFacingA.enabled = true;
    script.textStackAFacingB.enabled = false;
    script.textStackBFacingB.enabled = false;
    script.textStackPotFacingB.enabled = false;
  } else {
    // Enable correct UI elements
    script.startButton.enabled = false;
    script.checkButton.enabled = false;
    script.betButton.enabled = false;
    script.raiseButton.enabled = false;
    script.callButton.enabled = false;
    script.foldButton.enabled = false;
    script.nextHandButton.enabled = false;
    script.AWinsButton.enabled = false;
    script.BWinsButton.enabled = false;
    script.waitingMessage.text = "Waiting for opponent...";

    // Enable correct 3D text elements
    script.textStackAFacingA.enabled = false;
    script.textStackBFacingA.enabled = false;
    script.textStackPotFacingA.enabled = false;
    script.textStackAFacingB.enabled = true;
    script.textStackBFacingB.enabled = true;
    script.textStackPotFacingB.enabled = true;
  }

  // Start first hand
  onNextHand();
}

function onNextHand() {
  print("Hand started.");
  sharedCache.handNumber += 1;

  // Pay blinds - Only do this once (use current dealer for consistency)
  if (localCache.playerName == sharedCache.currentDealer) {
    payBlinds();

    // script.waitingMessage.text =
    //   "Reached A. playerName = " +
    //   localCache.playerName +
    //   ". currDealer = " +
    //   sharedCache.currentDealer +
    //   ".";

    // packets.sendObject("/poker/updateSharedCache/", sharedCache);
    // updateUI();

    packets.sendObject("/poker/nextHand/");

    // Enable correct UI elements
    script.startButton.enabled = false;
    script.checkButton.enabled = false;
    script.betButton.enabled = true;
    script.raiseButton.enabled = false;
    script.callButton.enabled = true;
    script.foldButton.enabled = true;
    script.nextHandButton.enabled = false;
    script.AWinsButton.enabled = false;
    script.BWinsButton.enabled = false;
    script.waitingMessage.text = "";
  } else {
    // Enable correct UI elements
    script.startButton.enabled = false;
    script.checkButton.enabled = false;
    script.betButton.enabled = false;
    script.raiseButton.enabled = false;
    script.callButton.enabled = false;
    script.foldButton.enabled = false;
    script.nextHandButton.enabled = false;
    script.AWinsButton.enabled = false;
    script.BWinsButton.enabled = false;
    script.waitingMessage.text = "Waiting for opponent...";
  }

  packets.sendObject("/poker/updateSharedCache/", sharedCache);
  updateUI();
}
