import { Scene, Math, Physics } from 'phaser';
import { Tank, RANGE } from './tank';
import { selectedRectangle, rangeCircle, projectile, generateHealthBars } from './textures';

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
        generateHealthBars(this);
    }
    create() {
        const tanks = [];
        const germans = [];

        const makeTank = (x, y, type, ar, playerTank) => {
            const tank = new Tank(this, playerTank, x, y, type, playerTank ? enemyGroup : playerGroup);

            ar.push(tank);
            if(playerTank){
                playerGroup.add(tank.chassis);
            }else{
                enemyGroup.add(tank.chassis);
            }
            this.tanks.push(tank);
        }

        const playerGroup = this.physics.add.group();
        const enemyGroup = this.physics.add.group();
        
        const countTanks = 8;
        for(let t = 1; t <= countTanks; t++){
            makeTank(100, t * 100, 'hotchkiss', tanks, true);
        }
        for(let t = 1; t <= countTanks; t++){
            makeTank(this.physics.world.bounds.width - 100, t * 100, 'panzer', germans, false);
        }

        this.physics.add.overlap(playerGroup, enemyGroup, (a, b) => {
            this.resolveTank(a).setVelocity(0);
            this.resolveTank(b).setVelocity(0);
        });

        this.physics.add.overlap(playerGroup, playerGroup, (a, b) => {
            this.resolveTank(a).setVelocity(0);
            this.resolveTank(b).setVelocity(0);
        });

        this.physics.add.overlap(enemyGroup, enemyGroup, (a, b) => {
            this.resolveTank(a).setVelocity(0);
            this.resolveTank(b).setVelocity(0);
        });


        this.input.on('pointerdown', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            const tanksSelected = tanks.filter(tank => tank.selected);
            if(gameObjects.length){
                const tankClicked = this.resolveTank(gameObjects[0])

                if(tankClicked.playerTank){
                    // my tank clicked
                    if(tanksSelected.length === 0){
                        tankClicked.selected = true;
                    }else if(tanksSelected.length){
                        tanksSelected.forEach(tank => tank.selected = false);
                        tankClicked.selected = true;
                    }
                }else {
                    // enemy tank clicked
                    tanksSelected.forEach(tank => tank.setTarget(tankClicked));
                }
            } else {
                // nothing clicked so move to clicked location
                const { worldX, worldY } = pointer;
                tanksSelected.forEach(tank => tank.driveTo(worldX, worldY));
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