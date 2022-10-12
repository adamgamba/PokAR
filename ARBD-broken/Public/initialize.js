// -----JS CODE-----

print("calling initialize.js...");

global.behaviorSystem.addCustomTriggerResponse("START_GAME", startGame);
var startgame = false;

function startGame(){
  print("starting game...")
  startgame = true;
  //script.startButton.enabled = false;
}
