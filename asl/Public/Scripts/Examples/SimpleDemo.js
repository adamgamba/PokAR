// -----JS CODE-----
// SimpleDemo.js
// Version: 0.1.0
// Description:  Uses Fingerspell Detector and Fingerspell Hint to detect and display 
// the letter the user signed with their hand

//@input Component.ScriptComponent fingerspellController {"label" : "Detector"}
//@input Component.ScriptComponent handSignHintController {"label" : "Hint"}
//@ui {"widget" : "separator"}

// Modify this function with your own experience!
function startExperience(fingerspell, handHint) {
    // add callback for when user gestures a new letter
    fingerspell.onNewChar.add(function(c) {
        if (handHint.showLetter) {
            handHint.showLetter(c);
        }
    });

    // handHint.show(); // Call to show hint
    // handHint.hide(); // Call to hide hint completely
}

function checkInputs() {
    if (!script.fingerspellController) {
        print("ERROR: Please assign Fingerspell Detector to the Detector field");
        return false;
    }
    if (!script.handSignHintController) {
        print("ERROR: Please assign Fingerspell Hint Script to the Hint field");
        return false;
    }
    return true;
}

function initialize() {
    startExperience(script.fingerspellController, script.handSignHintController);
}

if (checkInputs()) {
    script.createEvent("OnStartEvent").bind(initialize);
}
