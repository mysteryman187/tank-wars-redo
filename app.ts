import { Game, AUTO, Scene, Math, Physics } from 'phaser';

class MyScene extends Scene {
    private turret: Physics.Arcade.Sprite;
    private chassis: Physics.Arcade.Sprite;
    private moveToAngle: number;
    
    constructor(a) {
        super(a);
    }
    preload() {
        this.load.image('chassis', 'assets/images/hotchkiss-chassis-64.png');
        this.load.image('turret', 'assets/images/hotchkiss-turret-64.png');
    }
    create() {
        const chassis = this.physics.add.sprite(100, 100, 'chassis');
        const turret = this.turret = this.physics.add.sprite(100, 100, 'turret');
        

        this.input.on('pointermove', (pointer, gameObject) => {
            const { worldX, worldY } = pointer;
            const angleBetweenPointer = Math.Angle.BetweenPoints(chassis, { x: worldX, y: worldY });
            const moveToAngle = Math.Angle.WrapDegrees(Math.RadToDeg(angleBetweenPointer) + 90);
            this.moveToAngle = moveToAngle;
            const differenceAngle = Math.Angle.ShortestBetween(turret.angle, moveToAngle);
            if(differenceAngle > 0){
                this.turret.setAngularVelocity(100);
                console.log(this.moveToAngle);
            }else if(differenceAngle < 0){
                this.turret.setAngularVelocity(-100);
                console.log(this.moveToAngle);
            }
        });
    }
    update() {
        if(this.turret.body.angularVelocity > 0){
            // rotating clockwise
            if(this.moveToAngle > 0){
                if(this.turret.angle > 0 && this.turret.angle >= this.moveToAngle){
                    this.turret.setAngularVelocity(0);
                    console.log('stop 1');
                }
            } else if(this.moveToAngle < 0) {
                if(this.turret.angle < 0 && this.turret.angle >= this.moveToAngle){
                    this.turret.setAngularVelocity(0);
                    console.log('stop 2');
                }
            }
        }else if(this.turret.body.angularVelocity < 0){
            //rotating anti-clockwise
            if(this.moveToAngle < 0){
                if(this.turret.angle < 0 && this.turret.angle <= this.moveToAngle){
                    this.turret.setAngularVelocity(0);
                    console.log('stop 3');
                }
            } else if(this.moveToAngle > 0) {
                if(this.turret.angle > 0 && this.turret.angle <= this.moveToAngle){
                    this.turret.setAngularVelocity(0);
                    console.log('stop 4');
                }
            }
        }    
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

