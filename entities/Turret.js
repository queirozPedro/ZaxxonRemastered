import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Bullet from '../entities/Bullet.js';
import CollisionDetector from '../utils/CollisionDetector.js';

class Turret {
    constructor(scene, direction, position, gameSpeed) {
        this.scene = scene
        this.direction = direction
        this.position = position
        this.gameSpeed = gameSpeed;
        this.model = null;
        this.bullets = [];

        this.isDestroyed = false;
        this.shootInterval = 1000; // Intervalo de disparo (milissegundos)
        this.lastShootTime = 0;
        this.ZSpeed = 0.25; // Velocidade de movimento da torreta

        this.load();
    }

    load() {
        const loader = new GLTFLoader();

        loader.load(
            './assets/models/turret/Rail Gun Turret.gltf',
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(1.2, 1, 1.2);
                this.model.position.set(this.position.x, this.position.y + 0.4, this.position.z);
                this.model.rotation.y = (this.direction * Math.PI/180) + Math.PI / 2;
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
            (error) => {
                console.error('Erro ao carregar o modelo:', error);
            }
        );
    }

    // Movimenta a torreta para acompanhar as paredes
    moveTurret() {
        if (this.model) {
            this.model.position.z -= this.ZSpeed * this.gameSpeed; // Move a torreta no eixo Z
            this.destroyOutBounds()
        }
    }

    shoot(deltaTime) {
        this.lastShootTime += deltaTime;
        
        if(!this.isDestroyed){
            if (this.lastShootTime >= this.shootInterval / 1000) {
                const bullet = new Bullet(this.scene, this.model.position, this.model.rotation, this.direction, this.ZSpeed, false, true, this.gameSpeed, null)
                this.bullets.push(bullet)
                this.lastShootTime = 0;
            }
        }
    }

    update(deltaTime) {
        if(this.model){
            this.moveTurret(); // Move a torreta junto com a parede
            this.shoot(deltaTime); // Controla os tiros
            for(let i = 0; i < this.bullets.length; i++){
                this.bullets[i].update(deltaTime)
            }
        }
    }

    destroyOutBounds(){
        // Quando a torreta sair dos limites
        if (this.model.position.z < -120) {
            for(let i = 0; i < this.bullets.length; i++){
                this.scene.remove(this.bullets[i].destroy())
            }
            this.scene.remove(this.model)
            this.model = null
        }
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

    shootDestroy(){
        if (this.model) {
            this.scene.remove(this.model)
            this.isDestroyed = true;
        }
    }

    getIsDestroyed(){
        return this.isDestroyed;
    }

    getPositionZ(){
        return this.model.position.z;
    }
}

export default Turret;
