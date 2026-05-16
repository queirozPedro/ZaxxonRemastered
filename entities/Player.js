import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Bullet from '../entities/Bullet.js';
import CollisionDetector from '../utils/CollisionDetector.js';

class Player {
    constructor(scene, gameSpeed) {
        this.model = null;
        this.scene = scene;
        this.gameSpeed = gameSpeed;

        this.minHeight = 0.8; // Altura mínima (limite do chão)
        this.maxHeight = 10;   // Altura máxima (limite superior)
        this.maxWidthVariation = 13.5;  // Limites de movimentação lateral
        
        this.bullets = [];
        this.isShooting = false;
        this.isDestroyed = false;
        this.load(); // Chama o método de carregamento do modelo
    }

    update(keysPressed, deltaTime) {
        this.movementControls(keysPressed);

        for (let i = 0; i < this.bullets.length; i++) {
            this.bullets[i].update(deltaTime);
        }
    }

    movementControls(keysPressed) {
        // impede que o modelo seja referenciado sem nem existir
        if (!this.model) return;

        // Controla o movimento para cima
        if ((keysPressed['w'] || keysPressed['ArrowUp']) && this.model.position.y < this.maxHeight) {
            this.model.position.y += 0.1 * this.gameSpeed; // Faz virar
            if (this.model.rotation.x > -1.9) { // Se não estiver no máximo de inclinação 
                this.model.rotation.x -= 0.02 * this.gameSpeed; // inclina pra cima
            }
        } else if (this.model.rotation.x < -1.57) { // Se não estiver precionado e estiver inclinado
            this.model.rotation.x += 0.05 * this.gameSpeed; // faz voltar para a posição normal
        }

        // Controla o movimento para baixo
        if ((keysPressed['s'] || keysPressed['ArrowDown']) && this.model.position.y > this.minHeight) {
            this.model.position.y -= 0.1 * this.gameSpeed;
            if (this.model.rotation.x < -1.2) {
                this.model.rotation.x += 0.02 * this.gameSpeed;
            }
        } else if (this.model.rotation.x > -1.57) {
            this.model.rotation.x -= 0.05 * this.gameSpeed;
        }

        // Controla o movimento para a esquerda
        if ((keysPressed['a'] || keysPressed['ArrowLeft']) && this.model.position.x < this.maxWidthVariation) {
            this.model.position.x += 0.1 * this.gameSpeed;
            if (this.model.rotation.y < 0.3) {
                this.model.rotation.y += 0.02 * this.gameSpeed;
            }
        } else if (this.model.rotation.y > 0) {
            this.model.rotation.y -= 0.05 * this.gameSpeed;
        }

        // Controla o movimento para a direita
        if ((keysPressed['d'] || keysPressed['ArrowRight']) && this.model.position.x > -this.maxWidthVariation) {
            this.model.position.x -= 0.1 * this.gameSpeed; 
            if (this.model.rotation.y > -0.3) {
                this.model.rotation.y -= 0.02 * this.gameSpeed;
            }
        } else if (this.model.rotation.y < 0) {
            this.model.rotation.y += 0.05 * this.gameSpeed;
        }

        // Controle de tiro
        if (keysPressed[' '] || keysPressed['Enter']) {
            if (!this.isShooting) {
                this.shoot();
                this.isShooting = true;
            }
        } else {
            this.isShooting = false;
        }
    }

    shoot() {
        const bullet = new Bullet(this.scene, this.model.position, this.model.rotation, 0, 0, true, false, this.gameSpeed, this);
        this.bullets.push(bullet);
    }

    load() {
        const loader = new GLTFLoader();

        loader.load(
            './assets/models/spaceship/scene.gltf',

            (gltf) => {
                this.scene.add(gltf.scene);
                this.model = gltf.scene.children[0];
                this.model.position.set(0, 2, 0);
                this.model.scale.set(0.8, 1, 0.8);

                // Configura o modelo para projetar e receber sombras
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            },

            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },

            (error) => {
                console.error('Erro ao carregar o modelo:', error);
            }
        );
    }

    wallCollisionCheck(walls) {
        for (const wall of walls){
            if(CollisionDetector.checkBoxCollision(this.model, wall)){
                return true;
            }
            for(let i = 0; i < this.bullets.length; i++){
                if(CollisionDetector.checkBoxCollision(this.bullets[i].bullet, wall)){
                    this.bullets[i].destroy()
                }
            }
        }
    }

    enemyCollisionCheck(enemy){
        if(CollisionDetector.checkBoxCollision(this.model, enemy)){
            return true;
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

    destroy(){
        if(this.model && !this.isDestroyed){
            this.scene.remove(this.model);
            /** 
             * Como não consegui fazer o modelo da nave sumir, apenas fiz ele desaparecer.
             * Tem um lado bom nisso, os disparos da nave continuam sendo atualizados.
             */           
            this.model.visible = false; 
            this.model = null;
            this.isDestroyed = true;
        }
    }
}

// Exportação padrão
export default Player;
