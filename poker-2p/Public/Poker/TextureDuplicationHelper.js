//@input Asset.Texture[] textures
//@input Asset.Material material

//Make the function accessible for other scripts
script.api.playHitAnimation = playHitAnimation;

var textureIndex = 0;

function playHitAnimation(_object){
    //Clone a material from our material variable
    var newmaterial = script.material.clone();

    //Assign this material to designated object '_object'
    _object.getComponent("Component.Image").clearMaterials();
    _object.getComponent("Component.Image").addMaterial(newmaterial);
    
    //Assign a texture to the material according to its index
    newmaterial.mainPass.baseTex = script.textures[textureIndex];
    //play the texture animation from start    
    newmaterial.mainPass.baseTex.control.play(1,0);    
    
    //Increase the index, reset index if it’s smaller than total texture amount
    if(textureIndex < script.textures.length - 1){
        textureIndex ++;
    }else{
        textureIndex = 0;
    }

}