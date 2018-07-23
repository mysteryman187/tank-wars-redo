import { Game, AUTO, Scene, Math, Physics } from 'phaser';
import { Tank, RANGE } from './tank';
import { selectedRectangle, rangeCircle, projectile } from './textures';


export class BattleScene extends Scene {
    private tanks: Tank[] = [];
    constructor(a) {
        super(a);
       
    }
    preload() {
        this.load.image('panzer-chassis', 'assets/images/panzer-chassis-64.png');
        this.load.image('panzer-turret', 'assets/images/panzer-turret-64.png');
        this.load.image('hotchkiss-chassis', 'assets/images/hotchkiss-chassis-64.png');
        this.load.image('hotchkiss-turret', 'assets/images/hotchkiss-turret-64.png');
        selectedRectangle(this);
        console.log('==========', RANGE)
        rangeCircle(this, RANGE);
        projectile(this);
    }
    create() {
        const tanks = [];
        const germans = [];

        const makeTank = (x, y, type, ar, playerTank) => {
            const tank = new Tank(this, playerTank, x, y, type, playerTank ? enemyGroup : playerGroup);
            ar.push(tank);
            if(playerTank){
                tank.onClick(() => {
                    ar.filter(t => t!= tank).forEach(tank => tank.selected = false);
                    tank.selected = true;
                });    
                playerGroup.add(tank.chassis);
            }else{
                enemyGroup.add(tank.chassis);
            }
            this.tanks.push(tank);
        }

        const playerGroup = this.physics.add.group();
        const enemyGroup = this.physics.add.group();

        for(let t = 1; t < 6; t++){
            makeTank(50, t * 100, 'hotchkiss', tanks, true);
        }
        for(let t = 1; t < 6; t++){
            makeTank(500, t * 100, 'panzer', germans, false);
        }

        // this.input.on('pointermove', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
        //     const { worldX, worldY } = pointer;
        //     tank.aim(worldX, worldY);
        // });

        
        

        this.input.on('pointerdown', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            if(gameObjects.length){
                // todo maybe attack if its an enemy tank clicked
                tanks.filter(tank => tank.selected)
                .forEach(tank => tank.setTarget(this.resolveTank(gameObjects[0])))
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

    public resolveTank(chassis):Tank{
        return this.tanks.find(tank => tank.chassis === chassis);
    }
    public removeTank(tank:Tank){
        this.tanks = this.tanks.filter(t => t !== tank);
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
    backgroundColor: '#055f19',
    scene: BattleScene
});

