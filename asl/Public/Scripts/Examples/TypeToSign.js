// -----JS CODE-----
// TypeToSign.js
// Version: 0.1.0
// Description: Uses FingerspellDetector and Fingerspell Hint to spell a word entered via keyboard with a sign language, shows each next character once previous one was detected

//@input Component.ScriptComponent fingerspellController {"label" : "Detector"}
//@input Component.ScriptComponent handSignHintController {"label" : "Hint"}
//@ui {"widget" : "separator"}
// @input Component.Text text

// @input string onCompleteBehavior


var textToSpell;
var isEditing = false;
var index = 0;

function onTextEditingFinished() {
    isEditing = false;
    textToSpell = removeExtraCharacters(script.text.text);
    //reset index and time
    index = 0;
    print("reset");
}

function onTextEditingStarted() {
    isEditing = true;
}

function onHandFound() {
    textToSpell = removeExtraCharacters(script.text.text);
    index = 0;
    if (script.handSignHintController.showLetter) {
        script.handSignHintController.showLetter(textToSpell.charAt(index));
    }
}

function onNewChar(c) {
    if (isEditing) {
        return;
    }
    if (c == textToSpell.charAt(index)) {
        // Show next character
        index++;
        if (index < textToSpell.length) {
            if (script.handSignHintController.showLetter) {
                script.handSignHintController.showLetter(textToSpell.charAt(index));
            }
        } else {
            // Call behavior on complete
            if (global.behaviorSystem) {
                global.behaviorSystem.sendCustomTrigger(script.onCompleteBehavior);
            }
            // reset index 
            index = 0;
            if (script.handSignHintController.showLetter) {
                script.handSignHintController.showLetter("");
            }
        }
    }
}

// Modify this function with your own experience!
function initialize() {
    //set text to editable
    script.text.editable = true;

    //set keyboard event callbacks
    script.text.onEditingFinished.add(onTextEditingFinished);
    script.text.onEditingStarted.add(onTextEditingStarted);

    //set fingerspelling component event callbacks - see custom component description field for details
    script.fingerspellController.onHandFound.add(onHandFound);
    script.fingerspellController.onNewChar.add(onNewChar);

}

function removeExtraCharacters(s) {
    return s.toUpperCase().replace(/[^a-zA-Z]/g, "");
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

    if (!script.text) {
        print("ERROR: Please assign Text Component into the Text field");
        return false;
    }
    return true;
}

if (checkInputs()) {
    script.createEvent("OnStartEvent").bind(initialize);
}