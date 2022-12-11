//@input Component.ScriptComponent objectSpawner
//@input Component.ScriptComponent textureDuplicationHelper

//@input SceneObject mouthPositionObject
//@input Component.Camera camera

//@input Component.AudioComponent hitSound

var screenTransform = script.getSceneObject().getComponent("Component.ScreenTransform");
var fallingSpeed = script.objectSpawner.api.getFallingSpeed();

var threshold = 0.15;
var distanceFromMouth = 0;

var isHit = false;

var aspectRatio = script.camera.aspect;

//get components
var audioComponent = script.getSceneObject().getComponent("Component.AudioComponent");
var imageComponent = script.getSceneObject().getComponent("Component.Image");

script.createEvent("UpdateEvent").bind(function(){
//    print("Prefab updateevent called...")
    var currentpos = screenTransform.anchors.getCenter();
    currentpos.y -= fallingSpeed * getDeltaTime();
    screenTransform.anchors.setCenter(currentpos);

    //distanceFromMouth = currentpos.distance(getMouthPosition());
    distanceFromMouth = getDistance(currentpos, getMouthPosition());    
    
    if((distanceFromMouth < script.objectSpawner.api.getThreshold()) && !isHit){
        print("HIT!")
        
        script.objectSpawner.api.OnHit();
        
        script.textureDuplicationHelper.api.playHitAnimation(script.getSceneObject());
        audioComponent.play(1);        
        
        isHit = true;
    }
    
    if(isHit){
        var animatedTex = imageComponent.getMaterial(0).mainPass.baseTex;
        if(animatedTex.control.isFinished()){
            script.getSceneObject().destroy();
        }
    }
    
    if(currentpos.y < -1.5){
        script.objectSpawner.api.OnMissed();
        script.getSceneObject().destroy();
    }
});

function getDistance(pos1, pos2){
    //get x y distance between 2 points
    var xDistance = Math.abs(pos1.x - pos2.x);
    var yDistance = Math.abs(pos1.y - pos2.y);

    //multiplies aspect ratio to y
    yDistance /= aspectRatio;
    
    //get diagonal distance
    return Math.sqrt(xDistance*xDistance + yDistance*yDistance);
}

function getMouthPosition(){
    var mouthWorldPos = script.mouthPositionObject.getTransform().getWorldPosition();
    var mouthPos = script.camera.worldSpaceToScreenSpace(mouthWorldPos);
    mouthPos = new vec2(mouthPos.x*2-1, 1-mouthPos.y*2);
    return mouthPos;
}
