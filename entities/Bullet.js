import * as THREE from 'three'
import CollisionDetector from '../utils/CollisionDetector.js';

class Bullet{
    constructor(scene, position, rotation, direction, ZSpeed, isPlayerBullet, isTurretBullet, gameSpeed, playerPosition){
        this.scene = scene;
        this.isPlayerBullet = isPlayerBullet;
        this.isTurretBullet = isTurretBullet;
        this.direction = direction == 0? null: direction;
        this.gameSpeed = gameSpeed;
        this.playerPosition = playerPosition;

        this.maxZLimit = 260;
        this.mimZLimit = -40;
        this.xLimitVariation = 14;
        this.create(position, ZSpeed, rotation)
    }

    create(position, ZSpeed, rotation){
        let geometry = null
        if(this.isPlayerBullet || this.isTurretBullet){
            geometry = new THREE.BoxGeometry(0.8, 0.3, 0.3);
        }
        else{
            geometry = new THREE.BoxGeometry(.5, .5, .5);
        }
        const color = this.isPlayerBullet? 0x00fffff: this.isTurretBullet? 0xff0000: 0xffff00;
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.bullet = new THREE.Mesh(geometry, material)
        
        this.bullet.position.copy(position)
        this.bullet.rotation.copy(rotation)
        
        if(this.isPlayerBullet){

            // Para que o disparo saia do bico da nave
            this.bullet.position.z += 1.8;
            this.bullet.position.y += 0.6 - 2 * Math.cos(rotation.x);
            // Correção da orientação da bullet 
            this.bullet.rotation.set((Math.PI / 2), 0, (Math.PI / 2))

        } else {
            this.ZSpeed = ZSpeed;
            
            if(this.isTurretBullet) {
                this.bullet.rotation.y = this.direction * (Math.PI/180)
                this.bullet.position.x += 3.5 * Math.cos(this.direction * (Math.PI/180))
                this.bullet.position.y += 2
                this.bullet.position.z += 3.5 * Math.sin(-this.direction * (Math.PI/180))
            } else {
                // direction vai receber o vetor diferença entre a posição da bullet e a posição do player  
                this.direction = new THREE.Vector3().subVectors(this.playerPosition, this.bullet.position).normalize();
                // A atribui a rotação de acordo com a direção do vetor
                this.bullet.rotation.setFromVector3(this.direction);
            }   
        }
        
        this.scene.add(this.bullet)
    }

    update(deltaTime){
        if(this.bullet){
            if(this.isPlayerBullet){
                this.bullet.position.z += 0.6 * this.gameSpeed;
            }
            else {
                // Esse decréscimo serve para que o tiro acompanhe a velocidade da terreno
                this.bullet.position.z -= this.ZSpeed * this.gameSpeed; 
                
                if(this.isTurretBullet){
                    this.bullet.position.z += 0.2 * Math.sin(-this.direction * (Math.PI/180)) * this.gameSpeed;
                    this.bullet.position.x += 0.2 * Math.cos(-this.direction * (Math.PI/180)) * this.gameSpeed;
                }
                else {
                    this.bullet.position.add(this.direction.clone().multiplyScalar((this.ZSpeed + 50) * deltaTime));
                }
            }
            this.destroyOutBounds();
        }
    }

    destroyOutBounds(){
        if(this.bullet.position.z < this.mimZLimit || this.bullet.position.z > this.maxZLimit){
            this.destroy()
        } else if(this.bullet.position.x < -this.xLimitVariation || this.bullet.position.x > this.xLimitVariation){
            this.destroy()
        }
    }

    destroy(){
        this.scene.remove(this.bullet)
        this.bullet = null;
    }
}

export default Bullet;