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

var incr = 0;
print("Action: " + script.action);
if (script.action == actions.BET) {
    incr += 5;
    print("Bet Amount: " + script.betAmount);
    print("Incr valie: " + incr);
}

var num = Math.floor(Math.random() * 10);

print("text var =" + script.text);
//script.text.text = "Prev Action: " + script.action;
print("Screen text changed on tap: " + script.text.text);

