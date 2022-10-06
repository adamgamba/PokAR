// -----JS CODE-----
// Version: 1.0.0
// Event: On Awake
// Description: Fix shadow plane rendering for the world mesh
//
//@input Component.RenderMeshVisual worldMesh
//@input Component.Script accurateScaleItem
//@input SceneObject shadowPlane


const shadow_t = script.shadowPlane.getTransform();

script.createEvent("UpdateEvent").bind(function(eventData) {
    if (!script.worldMesh.getSceneObject().enabled) {
        return;
    }

    const aabb = script.accurateScaleItem.api.getAabb();
    const aabb_height = aabb.max.y - aabb.min.y;
    script.worldMesh.mainPass.shadow_y = shadow_t.getWorldPosition().y;
    script.worldMesh.mainPass.item_height = aabb_height / 2;
});

