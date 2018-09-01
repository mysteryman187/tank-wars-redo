import { Scene, Math, Physics } from 'phaser';
import { Tank, RANGE } from './tank';
import { selectedRectangle, rangeCircle, projectile, generateHealthBars } from './textures';
import { Connection } from './comms/Connection';

export class BattleScene extends Scene {
    private allTanks: Tank[] = [];
    private connection: Connection;
    constructor() {
        super(null);
    }
    onMessage(message){
        switch(message.type){

        }
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

    create({ connection, numTanks =  8, isPlayerGerman }) {
        this.connection = connection;
        connection.onMessage = this.onMessage;

        const allies = [];
        const germans = [];
        const myTanks = () => isPlayerGerman ? germans : allies;
        const makeTank = (x, y, type, ar, playerTank) => {
            const tank = new Tank(this, playerTank, x, y, type, playerTank ? enemyGroup : playerGroup);
            ar.push(tank);
            if(playerTank){
                playerGroup.add(tank.chassis);
            }else{
                enemyGroup.add(tank.chassis);
            }
            this.allTanks.push(tank);
        }

        const playerGroup = this.physics.add.group();
        const enemyGroup = this.physics.add.group();
        
        
        const allyX = 100;
        const tanksStartY = 300;
        for(let t = 1; t <= numTanks; t++){
            makeTank(allyX, tanksStartY + (t * 100), 'hotchkiss', allies, !isPlayerGerman);
        }
        
        const germansX = (this.physics.world.bounds.width * 2) - 100;
        let yMax = 0;
        for(let t = 1; t <= numTanks; t++){
            yMax = tanksStartY + (t * 100);
            makeTank(germansX, yMax, 'panzer', germans, isPlayerGerman);
        }
        this.cameras.main.setBounds(0, 0, germansX + 100, yMax + 100);

        if(isPlayerGerman){
            this.cameras.main.scrollX = germansX - (this.physics.world.bounds.width / 2);
        }else{
            this.cameras.main.scrollX = allyX - (this.physics.world.bounds.width / 2);               
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

        // var cursors = this.input.keyboard.createCursorKeys();
        // var controlConfig = {
        //     camera: this.cameras.main,
        //     left: cursors.left,
        //     right: cursors.right,
        //     up: cursors.up,
        //     down: cursors.down,
        //     acceleration: 0.06,
        //     drag: 0.0005,
        //     maxSpeed: 1.0
        // };
        // const controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);


        this.input.on('pointerdown', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            const tanksSelected = myTanks().filter(tank => tank.selected);
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
        this.allTanks.forEach(t => t.update()); 
        // todo use...
         console.log(this.input.activePointer.position);
        // to move the camera.scroll.x and such when near boundary
    }

    public resolveTank(chassis):Tank{
        return this.allTanks.find(tank => tank.chassis === chassis);
    }
    public removeTank(tank:Tank){
        this.allTanks = this.allTanks.filter(t => t !== tank);
    }

}