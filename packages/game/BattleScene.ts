import { Scene, Math, Physics } from 'phaser';
import { Tank, RANGE } from './tank';
import { selectedRectangle, rangeCircle, projectile, generateHealthBars } from './textures';
import { Connection } from './comms/Connection';
import { LobbyScene } from './LobbyScene';

export class BattleScene extends Scene {
    private allTanks: Tank[] = [];
    private allies: Tank[] = [];
    private germans: Tank[] = [];
    private isPlayerGerman: boolean;
    private pointerdown: boolean = false;

    private connection: Connection;
    constructor() {
        super(null);
    }
    onMessage(message) {
        switch (message.type) {
            case 'echo_move': {
                const tank = this.enemyTanks()[message.index];
                tank.driveTo(message.worldX, message.worldY);
                break;
            }
            case 'echo_target': {
                const { index, targetIndex } = message;
                const tank = this.enemyTanks()[index];
                const target = this.myTanks()[targetIndex];
                tank.setTarget(target);
                break;
            }
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
    myTanks() {
        return this.isPlayerGerman ? this.germans : this.allies;
    }
    enemyTanks() {
        return this.isPlayerGerman ? this.allies : this.germans;
    }
    create({ connection, numTanks = 7, isPlayerGerman }) {
        this.connection = connection;
        if (connection) {
            connection.onMessage = message => this.onMessage(message);
        }
        this.isPlayerGerman = isPlayerGerman;

        const makeTank = (x, y, type, ar, playerTank) => {
            const tank = new Tank(this, playerTank, x, y, type, playerTank ? enemyGroup : playerGroup, connection);
            ar.push(tank);
            if (playerTank) {
                playerGroup.add(tank.chassis);
            } else {
                enemyGroup.add(tank.chassis);
            }
            this.allTanks.push(tank);
        }

        const playerGroup = this.physics.add.group();
        const enemyGroup = this.physics.add.group();
        const halfGameWidth = (1440 / 2);
        const allyX = halfGameWidth + 200;
        const tanksStartY = 300;
        const spaceBetwen = 120;
        for (let t = 1; t <= numTanks; t++) {
            makeTank(allyX, tanksStartY + (t * spaceBetwen), 'hotchkiss', this.allies, !isPlayerGerman);
        }

        const germansX = 1440 + halfGameWidth - 200;
        let yMax = 0;
        for (let t = 1; t <= numTanks; t++) {
            yMax = tanksStartY + (t * spaceBetwen);
            makeTank(germansX, yMax, 'panzer', this.germans, isPlayerGerman);
        }
        this.cameras.main.setBounds(0, 0, 1440 * 2, 1500, true);

        if (isPlayerGerman) {
            this.cameras.main.scrollX += (halfGameWidth - 400);// = germansX - (this.physics.world.bounds.width / 2);
        } else {
            this.cameras.main.scrollX -= (halfGameWidth + 400);// = allyX - (this.physics.world.bounds.width / 2);               
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

        let startPos;
        this.input.on('pointerup', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            this.pointerdown = false;
        });

        this.input.on('pointermove', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            if (this.sys.game.device.input.touch && this.pointerdown) {
                // scroll camera on mobile only
                const moveXBy = startPos.x - pointer.position.x;
                const moveYBy = startPos.y - pointer.position.y;
                this.cameras.main.setScroll(startPos.scrollX + moveXBy, startPos.scrollY + moveYBy);
            }
        });

        this.input.on('pointerdown', (pointer, gameObjects: Physics.Arcade.Sprite[]) => {
            this.pointerdown = true;
            const { x, y } = pointer.position;
            startPos = { x, y, scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY };

            const tanksSelected = this.myTanks().filter(tank => tank.selected);
            if (gameObjects.length) {
                const tankClicked = this.resolveTank(gameObjects[0])

                if (tankClicked.playerTank) {
                    // my tank clicked
                    if (tanksSelected.length === 0) {
                        tankClicked.selected = true;
                    } else if (tanksSelected.length) {
                        tanksSelected.forEach(tank => tank.selected = false);
                        tankClicked.selected = true;
                    }
                } else {
                    // enemy tank clicked
                    tanksSelected.forEach(tank => {
                        const index = this.myTanks().indexOf(tank);
                        const targetIndex = this.enemyTanks().indexOf(tankClicked);
                        if (index !== -1 && targetIndex !== -1) {
                            this.send({ type: 'echo_target', index, targetIndex });
                        }
                        tank.setTarget(tankClicked);
                    });
                }
            } else {
                // nothing clicked so move to clicked location
                const { worldX, worldY } = pointer;
                tanksSelected.forEach(tank => {
                    const index = this.myTanks().indexOf(tank);
                    if (index !== -1) {
                        this.send({ type: 'echo_move', index, worldX, worldY });
                    }
                    tank.driveTo(worldX, worldY);
                });
            }
        });
    }

    send(message) {
        if (this.connection) {
            this.connection.send(message);
        }
    }

    update() {
        this.allTanks.forEach(t => t.update());
        this.scrollCamera();
    }

    scrollCamera() {
        const camera = this.cameras.main;
        if (!this.sys.game.device.input.touch) {
            const { position } = this.input.activePointer;
            const THRESHOLD = 50;
            const SCROLL_SPEED = 5;
            if (position.x < THRESHOLD) {
                camera.scrollX -= SCROLL_SPEED;
            } else if (position.x > camera.width - THRESHOLD) {
                camera.scrollX += SCROLL_SPEED;
            }

            if (position.y < THRESHOLD) {
                camera.scrollY -= SCROLL_SPEED;
            } else if (position.y > camera.height - THRESHOLD) {
                camera.scrollY += SCROLL_SPEED;
            }
        }
    }

    public resolveTank(chassis): Tank {
        return this.allTanks.find(tank => tank.chassis === chassis);
    }
    public destroyTank(tank: Tank) {
        // WARNING - THIS SEEMS TO MESS WITH MESSAGES(NOT SURE IF COMMENTING THIS OUT WILL EVEN RESOLVE FUNDAMENTAL ISSUE!)
        // const removePlayerArray = (ar) => {
        //     const index = ar.indexOf(tank);
        //     if (index !== -1) {
        //         ar.splice(index, 1);
        //     }
        // }
        // if (tank.playerTank) {
        //     removePlayerArray(this.myTanks());
        // } else {
        //     removePlayerArray(this.enemyTanks());
        // }
        this.allTanks = this.allTanks.filter(t => t !== tank);
        this.maybeWinLose();
    }

    maybeWinLose() {
        const win = this.allTanks.every(tank => tank.playerTank);
        const lose = this.allTanks.every(tank => !tank.playerTank);
        if (win) {
            // todo dialog or something
            this.scene.start('lobby');
        }
        else if (lose) {
            // todo dialog or something
            this.scene.start('lobby');
        }
    }

}