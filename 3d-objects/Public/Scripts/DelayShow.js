// -----JS CODE-----
//@input float delayTime
//@input float revalTime

const sceneObject = script.getSceneObject();
const image = sceneObject.getComponent("Component.Image");

var time = 0;
const startTime = new Date().getTime();
script.createEvent("UpdateEvent").bind(function(eventData) {
    if (time > 10) { // Stop enlarging after 10s
        return;
    }

    time = (new Date().getTime() - startTime) / 1000;
    var alpha;
    if (time < script.delayTime) {
        alpha = 0;
    } else if (time > (script.delayTime + script.revalTime)) {
        alpha = 1;
    } else {
        alpha = (time - script.delayTime) / script.revalTime;
    }

    const newColor = image.mainPass.baseColor;
    newColor.w = alpha;
    image.mainPass.baseColor = newColor;
});

