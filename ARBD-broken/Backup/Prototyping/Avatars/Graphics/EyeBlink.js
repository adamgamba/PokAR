

var renderMeshVisual = script.getSceneObject().getComponent('RenderMeshVisual');
var material = renderMeshVisual.getMaterial(0).clone();
renderMeshVisual.clearMaterials();
renderMeshVisual.addMaterial(material);

var timings = [3, 0.2, 0.2, 0.1];
var index = 0;
var lastActionTime = Number.MIN_VALUE;
var isBlinking = false;

script.createEvent('UpdateEvent').bind(function () {
    var now = global.getTime();
    if (now - lastActionTime > timings[index]) {
        lastActionTime = now;
        if (++index >= timings.length) {
            index = 0;   
            timings[0] = 3 + (Math.random() * 3);
        }
        isBlinking = !isBlinking;
        renderMeshVisual.mainPass["blink"] = isBlinking ? 1 : 0;
    }
});
