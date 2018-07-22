import { Game, AUTO, Scene, Math, Physics } from 'phaser';
import { Tank } from './tank';

class MyScene extends Scene {
    private tanks: Tank[] = [];
    constructor(a) {
        super(a);
    }
    preload() {
        this.load.image('chassis', 'assets/images/hotchkiss-chassis-64.png');
        this.load.image('turret', 'assets/images/hotchkiss-turret-64.png');
    }
    create() {
        for(let t = 0; t < 10; t++){
            const tank = new Tank(this, Math.Between(10, 700), t * 100);
            this.input.on('pointermove', (pointer, gameObject) => {
                const { worldX, worldY } = pointer;
                tank.aim(worldX, worldY);
            });
            this.tanks.push(tank);
        }
    }
    update() {
        this.tanks.forEach(t => t.update()); 
    }
}

const game = new Game({
    type: AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: MyScene
});

