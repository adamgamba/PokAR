// -----JS CODE-----
// @input Component.Text text
// @input string action
// @input float betAmount

const actions = {
  FOLD: "fold",
  CHECK: "check",
  CALL: "call",
  BET: "bet",
};

print("Action: " + script.action);
if (script.action == actions.BET) {
    print("Bet Amount: " + script.betAmount);
}

var num = Math.floor(Math.random() * 10);

script.text.text = "Random = " + num;
print("Screen text changed on tap: " + script.text.text);

