import * as THREE from 'three';

class CollisionDetector{
    static checkBoxCollision(obsject1, obsject2){
        if(obsject1 && obsject2){
            const ObjectBox1 = new THREE.Box3().setFromObject(obsject1);
            const ObjectBox2 = new THREE.Box3().setFromObject(obsject2);
            return ObjectBox1.intersectsBox(ObjectBox2);
        }
    }
}

export default CollisionDetector;