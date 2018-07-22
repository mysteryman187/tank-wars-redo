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
        const tanks = [];
        for(let t = 1; t < 6; t++){
            const tank = new Tank(this, Math.Between(10, 700), t * 100);
            tanks.push(tank);
            tank.onClick(() => {
                tanks.filter(t => t!= tank).forEach(tank => tank.selected = false);
                tank.selected = true;
              ///  console.log('tank onlick', arguments);
            });
            this.tanks.push(tank);
        }

        // this.input.on('pointermove', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
        //     const { worldX, worldY } = pointer;
        //     tank.aim(worldX, worldY);
        // });

        this.input.on('pointerdown', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            if(gameObjects.length){
                // todo maybe attack if its an enemy tank clicked
            } else {
                // nothing clicked so move to clicked location
                const { worldX, worldY } = pointer;
                tanks.filter(tank => tank.selected)
                .forEach(tank => tank.driveTo(worldX, worldY))
            }
        });
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

