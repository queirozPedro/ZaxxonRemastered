import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import Background from './entities/Background.js';
import Player from './entities/Player.js';
import Ground from './entities/Ground.js';
import Wall from './entities/Wall.js';
import Turret from './entities/Turret.js';
import Alien from './entities/Alien.js';

// Cena, câmera e renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

// Configurações que permitem ao render usar sombras
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Ajustando a câmera para a perspectiva do Zaxxon
camera.position.set(-12, 19, -17);

// Adapta a cena de acordo com o tamanho da tela 
function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Controles orbitais para teste
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

// Carrega o chão e o background, e permite ao chão receber sombras
const gameSpeed = 1.8;
const background = new Background(scene, 8);
const ground = new Ground(scene, gameSpeed);
ground.ground.receiveShadow = true;

function startLigths(){
    /**
     * A Luz pontual ficará sobre a nave, para projetar sua sombra sobre o chão da fase.
     * A luz ambiente serve apenas para que a parte escura não fique estranha
    */
   const pointLight = new THREE.PointLight(0xffffff, 10000, 10000);
   pointLight.position.set(0, 100, 0);
   // Os Objetos que recebem esta luz poderam projetar sombra
   pointLight.castShadow = true;
   // A wifth e o height serão a resolução da sombra, nesse caso 1024x1024 pixels
   pointLight.shadow.mapSize.width = 1024;
   pointLight.shadow.mapSize.height = 1024;
   scene.add(pointLight)
   // Luz ambiente fraquinha pra não ficar escuro demais
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
   scene.add(ambientLight);
}

startLigths()

// Relógio que será usado para medir o deltaTime
const clock = new THREE.Clock();

// Declara o jogador, o array de muros e o de torretas
const player = new Player(scene, gameSpeed);
const walls = [];
const turrets = [];
const aliens = [];

// Algumas variáveis para gerenciar o tempo
let tempoDecorrido = 0
let intervaloDeTempo = 0;

// Função animate, que executa a cada frame
function animate() {
    requestAnimationFrame(animate);
    
    // Atualiza a cena
    update()
    renderer.render(scene, camera);    
}

function update(){
    // clock.getDelta retorna o tempo (em segundos) decorrido desde de sua ultima chamada 
    const deltaTime = clock.getDelta();
    tempoDecorrido += deltaTime;

    // A cada intervaloDeTempo novos obstáculos irão spawnar
    if(tempoDecorrido >= intervaloDeTempo){
        spawnObjects()
        tempoDecorrido = 0;
        intervaloDeTempo = (Math.random() * 10 + 5) / gameSpeed;
    }

    // Atualizando o jogador e o environment
    player.update(keysPressed, deltaTime);
    ground.update(deltaTime, gameSpeed);
    background.update(); 

    // Atualizando os obsctáculos
    updateWalls()
    updateTurrets(deltaTime)
    updateAliens(deltaTime)
}

// Atualiza todos os muros
function updateWalls(){
    for(let i = walls.length - 1; i >= 0; i--){ 
        if(walls[i] && walls[i].wall){
            walls[i].update();
        } else {
            walls.splice(i, 1);
        }

        // Testa a colisão entre o player e os tiros contra o muro 
        if (walls[i] && player.wallCollisionCheck(walls[i].wall)) {
            endGame();
        }
    }
}

// Atualiza todas as torretas
function updateTurrets(deltaTime){
    for(let i = turrets.length - 1; i >= 0; i--){ 
        if(turrets[i]){ 
            turrets[i].update(deltaTime);

            for(let j = 0; j < walls.length; j++){
                turrets[i].wallCollisionCheck(walls[j].wall);
            }
        } else {
            turrets.splice(i, 1); // Remove a torreta que for null
        }

        // Testa a colisão entre o jogador e a torreta
        if(turrets[i] && player.enemyCollisionCheck(turrets[i].model) && !turrets[i].getIsDestroyed()){
            endGame();
        }

        // Testa a colisão entre o tiro do jogador e a torreta
        if(turrets[i] && !turrets[i].getIsDestroyed()){
            if(player.enemyBulletCollisionCheck(turrets[i].model)){
                turrets[i].shootDestroy();
            }
        }

        // Testa as colisões entre o tiro da torreta e o jogador
        if(turrets[i] && turrets[i].enemyBulletCollisionCheck(player.model)){
            endGame();
        }
    }
}

// Atualiza os aliens
function updateAliens(deltaTime){
    for(let i = aliens.length - 1; i >= 0; i--){
        if(aliens[i]){
            aliens[i].update(deltaTime, player);

            // Destroi os tiros do alien que pegar no muro
            for(let j = 0; j < walls.length; j++){
                aliens[i].wallCollisionCheck(walls[j].wall);
            }

            // Checa se o player bater no alien, se bater perde
            if(player.enemyCollisionCheck(aliens[i].model) && !aliens[i].getIsDestroyed()){
                endGame();
            }

            // Checa se o tiro do jogador pegou no alien, se pegar destrói
            if(!aliens[i].getIsDestroyed()){
                if(player.enemyBulletCollisionCheck(aliens[i].model)){
                    aliens[i].shootDestroy();
                }
            }

            // Testa as colisões entre o tiro do alien e o jogador
            if(aliens[i] && aliens[i].enemyBulletCollisionCheck(player.model)){
                endGame();
            }
        } else {
            aliens.splice(i, 1); 
        }
    }
}


/**
 * A função spawnObjects instancia os objetos na cena de maneira quase aleatória
 */
function spawnObjects(){
    // A altura do muro
    const altura = 3;
    // A quantidade de muros quebrados, no mínimo 2 e no máximo 6
    const murosQuebrados = Math.round(Math.random() * 4) + 2;
    // A posição z do muro, começando no final do ground e variando mais 20
    const wallSpawnPointZ = 260 + Math.random() * 30;
    // Cria a instância do muro
    const wall = new Wall(scene, altura, murosQuebrados, wallSpawnPointZ, gameSpeed);
    walls.push(wall)

    for(let i = 0; i < 4; i++){
        // Chance de 50% para uma torreta spawnar
        if(Math.round(Math.random() * 100) < 50){
            // A posição x da torreta vai variar de -10 a 10
            const turretSpawnPointX = (Math.random() * 20) - 10;
            // De acordo com a posição de x, a torreta vai buscar atirar para um lado que faça sentido
            const direction = turretSpawnPointX < 0? (Math.random() * 180) - 90: (Math.random() * 180) + 90;
            // A posição da torreta no eixo z vai variar de 40 em 40
            const turretSpawnPointZ = wallSpawnPointZ + ((i+1)*30)
            // Cria a instância da torreta
            const turret = new Turret(scene, direction , {x:turretSpawnPointX, y:0, z:turretSpawnPointZ}, gameSpeed);
            turrets.push(turret)
        
        // Se a torreta não spawnar, tem 30% de chance de spawnar um alien
        } else if(Math.round(Math.random() * 100) < 30){
            const alienSpawnPointZ = wallSpawnPointZ + ((i+1)*30);

            const alien = new Alien(scene, alienSpawnPointZ, gameSpeed);
            aliens.push(alien)
        }
    }
}

// Dicionário que atribui true para as teclas que estão pressionadas
const keysPressed = {};
window.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});
// Adiciona false para as teclas que não estão mais apertadas
window.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

window.addEventListener('resize', (event) => onWindowResize(camera, renderer));

// Função para finalizar o jogo
function endGame() {
    player.destroy();
}

// Inicia a animação e o jogo
animate();
