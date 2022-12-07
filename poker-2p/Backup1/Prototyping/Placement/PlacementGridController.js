//@input SceneObject cursor
//@input float yOffset
//@input Asset.Material proximityGridMaterial
//@input Component.Script blockDrawing
var transform = script.getSceneObject().getTransform();

var update = script.createEvent("UpdateEvent");
update.bind(function () {
  var cursorPosition = script.blockDrawing.api.getCursorWorldPosition();
  //   print("update event: update.bind"); // ! runs very often

  script.proximityGridMaterial.mainPass.uCursorPosition =
    cursorPosition;
  // var cursorColor = script.blockDrawing.api.getCurrentColor();
  // script.proximityGridMaterial.mainPass.uLineColor = cursorColor;
  cursorPosition.y -= script.yOffset;
  transform.setWorldPosition(cursorPosition);
});
