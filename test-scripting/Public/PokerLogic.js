import assert from "assert";

// First hand
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
var stacks = {
  A: 100,
  B: 100,
  POT: 0,
};
var dealer = players.A;
var villain = players.B;
var currentRound = rounds.PREFLOP;
var previousAction = null;
var playing = true;

while (playing) {
  // * Pre-flop

  // Little blind is dealer
  betsAmount(dealer, blinds.LITTLE);

  // Big blind is villain
  betsAmount(villain, blinds.BIG);

  //     stacks.B -= blinds.BIG;
  //   } else {
  //     stacks.A -= blinds.BIG;
  //     stacks.B -= blinds.LITTLE;
  //   }
  //   stacks.POT += blinds.LITTLE + blinds.BIG;

  // First action goes to dealer
  var options = [actions.FOLD, actions.CALL, actions.BET];

  // todo - get user action
  var action = actions.BET;
  previousAction = action;
  var amount = 3;

  switch (action) {
    case actions.FOLD: // villain wins
      endHand(villain);
      break;
    case actions.CALL: // action goes to !dealer
      betsAmount(dealer, blinds.BIG - blinds.LITTLE);
      break;
    case actions.BET: // action goes to !dealer
      betsAmount(dealer, amount);
      break;
    default:
      console.log("error - shouldnt get here");
  }

  // Villains turn to play, pre-flop
  if (previousAction == actions.CALL) {
    options = [actions.CHECK, actions.RAISE];

    // todo - get user action
    action = actions.CHECK;
    amount = 0;
    previousAction = action;

    switch (action) {
      case actions.CHECK:
        advanceRound();
        break;
      case actions.RAISE:
        betsAmount(villain, amount);
        // ! TODO - ADVANCE ACTION BACK AROUND TO OPPONENT
        break;
      default:
        console.log("error - shouldnt get here");
    }
  } else if (previousAction == actions.BET) {
    options = [actions.FOLD, actions.CALL, actions.RAISE];

    // todo - get user action
    action = actions.FOLD;
    previousAction = action;
    amount = 0;

    switch (action) {
      case actions.FOLD:
        endHand(dealer);
        break;
      case actions.CALL:
        betsAmount(villain, amount); // todo
        // ! TODO - AMOUNT TO CALL
        break;
      case actions.RAISE:
        betsAmount(villain, amount);
        // ! TODO - ADVANCE ACTION BACK AROUND TO OPPONENT
        break;
      default:
        console.log("error - shouldnt get here");
    }
  }

  // * Flop / Turn / River
  while (
    currentRound == rounds.FLOP ||
    currentRound == rounds.TURN ||
    currentRound == rounds.RIVER
  ) {
    // First action goes to villain
    options = [actions.CHECK, actions.BET];

    // todo - get user action
    action = actions.CHECK;
    previousAction = action;
    amount = 3;

    switch (action) {
      case actions.CHECK:
        break;
      case actions.BET: // action goes to !dealer
        betsAmount(villain, amount);
        break;
      default:
        console.log("error - shouldnt get here");
    }

    // Second action goes to dealer
    if (previousAction == actions.CHECK) {
      options = [actions.CHECK, actions.BET];

      // todo - get user action
      action = actions.CHECK;
      previousAction = action;
      amount = 3;

      switch (action) {
        case actions.CHECK:
          advanceRound(); // ? continue
          break;
        case actions.BET:
          betsAmount(dealer, amount);
          // ! TODO - ADVANCE ACTION BACK AROUND TO OPPONENT
          break;
        default:
          console.log("error - shouldnt get here");
      }
    } else if (previousAction == actions.BET) {
      options = [actions.FOLD, actions.CALL, actions.RAISE];

      // todo - get user action
      action = actions.FOLD;
      previousAction = action;
      amount = 3;

      switch (action) {
        case actions.FOLD:
          endHand(dealer);
          break;
        case actions.CALL:
          betsAmount(villain, amount); // todo
          // ! TODO - AMOUNT TO CALL
          advanceRound();
          break;
        case actions.RAISE:
          betsAmount(villain, amount);
          // ! TODO - ADVANCE ACTION BACK AROUND TO OPPONENT
          break;
        default:
          console.log("error - shouldnt get here");
      }
    }
  }

  // IF both players have gotten here, showdown() has been called, and
  // the players are prompted to flip their cards and see who won
  // todo - collect user input
  var winner = players.A;
  endHand(winner);
}

function endHand(winner) {
  if (winner == players.A) {
    stacks.A += stacks.POT;
  } else {
    stacks.B += stacks.POT;
  }
  stacks.POT = 0;
  dealer = dealer == players.A ? players.B : players.A;
  currentRound = rounds.PREFLOP;
  previousAction = null;
}

function advanceRound() {
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
  print("Showdown - who has the winner?");

  // todo - collect user input
  var winner = players.A;
  endHand(winner);
}

function betsAmount(player, amount) {
  assert(stacks[player] >= amount);
  stacks[player] -= amount;
  stacks.POT += amount;
}
