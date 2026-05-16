import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Bullet from '../entities/Bullet.js';
import CollisionDetector from '../utils/CollisionDetector.js';

class Alien {
    constructor(scene, spawnPointZ, gameSpeed){
        this.model = null;
        this.scene = scene;
        this.spawnPointZ = spawnPointZ;
        this.gameSpeed = gameSpeed;

        this.isDestroyed = false;
        this.minHeight = 1.2; // Altura mínima (limite do chão)
        this.maxHeight = 10;   // Altura máxima (limite superior)
        this.maxWidthVariation = 13.5;  // Limites de movimentação lateral
        this.ZSpeed = 0.25;
        
        // A direção do movimento do alien
        this.xMovementDirection = ((Math.random() * 2) - 1) / (10 - gameSpeed) 
        this.yMovementDirection = this.xMovementDirection / 2
        
        // atirar
        this.bullets = [];
        this.shootInterval = 800; 
        this.lastShootTime = 0;

        this.load();
    }

    load() {
        const loader = new GLTFLoader();    
    
        loader.load(
            './assets/models/alien/scene.gltf', 
    
            // Chamado quando o recurso é carregado
            (gltf) => {
                this.model = gltf.scene;
                this.model.position.set(0, 5, this.spawnPointZ);
                this.model.scale.set(0.8, 0.8, 0.8);
                this.scene.add(this.model);

                // Configura o modelo para projetar e receber sombras
                this.model.traverse((child) => {
                    if (child.isMesh) {     
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            },
            undefined,
            // Progresso do carregamento
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
    
            // Chamado quando ocorre um erro no carregamento
            (error) => {
                console.error('Erro ao carregar o modelo:', error);
            }
        );
    }

    update(deltaTime, player){
        if(this.model){
            this.moveAlien();         
            this.destroyOutBounds();
            if(player.model)
                this.shoot(deltaTime, player.model.position);
            for(let i = 0; i < this.bullets.length; i++){
                this.bullets[i].update(deltaTime)
            }
        }
    }
    
    shoot(deltaTime, playerPosition) {
        this.lastShootTime += deltaTime;
        
        if(!this.isDestroyed){
            if (this.lastShootTime >= this.shootInterval / 1000) {
                const bullet = new Bullet(this.scene, this.model.position, this.model.rotation, 0, this.ZSpeed, false, false, this.gameSpeed, playerPosition)
                this.bullets.push(bullet)
                this.lastShootTime = 0;
            }
        }
    }

    moveAlien(){
        if(this.model.position.y > this.maxHeight){
            this.yMovementDirection *= -1;
        }
        if(this.model.position.y < this.minHeight){
            this.yMovementDirection *= -1;               
        }
        if(this.model.position.x > this.maxWidthVariation){
            this.xMovementDirection *= -1;
        }
        if(this.model.position.x < -this.maxWidthVariation){
            this.xMovementDirection *= -1;               
        }

        this.model.position.y += this.yMovementDirection;
        this.model.position.x += this.xMovementDirection;
        this.model.position.z -= this.ZSpeed * this.gameSpeed;
    }

    wallCollisionCheck(walls) {
        for (const wall of walls){
            for(let i = 0; i < this.bullets.length; i++){
                if(CollisionDetector.checkBoxCollision(this.bullets[i].bullet, wall)){
                    this.bullets[i].destroy()
                }
            }
        }
    }   

    enemyBulletCollisionCheck(enemy){
        for(let i = 0; i < this.bullets.length; i++){
            if(CollisionDetector.checkBoxCollision(this.bullets[i].bullet, enemy)){
                this.bullets[i].destroy()
                return true;
            }
        }
    }

    destroyOutBounds(){
        if (this.model.position.z < -120) {
            for(let i = 0; i < this.bullets.length; i++){
                this.scene.remove(this.bullets[i].destroy())
            }
            this.scene.remove(this.model)
            this.model = null
        }
    }

    shootDestroy(){
        if (this.model) {
            this.scene.remove(this.model)
            this.isDestroyed = true;
        }
    }

    getIsDestroyed(){
        return this.isDestroyed;
    }
}
export default Alien;