import { Physics, Scene, Math } from 'phaser';

export class Tank {
    private turret: Physics.Arcade.Sprite;
    private chassis: Physics.Arcade.Sprite;
    private aimAngle: number;

    constructor(scene: Scene, x: number, y: number){
        this.chassis = scene.physics.add.sprite(x, y, 'chassis');
        this.turret = scene.physics.add.sprite(x, y, 'turret');
    }

    update(){
        if(this.turret.body.angularVelocity > 0){
            // rotating clockwise
            if(this.aimAngle > 0){
                if(this.turret.angle > 0 && this.turret.angle >= this.aimAngle){
                    this.turret.setAngularVelocity(0);
                }
            } else if(this.aimAngle < 0) {
                if(this.turret.angle < 0 && this.turret.angle >= this.aimAngle){
                    this.turret.setAngularVelocity(0);
                }
            }
        }else if(this.turret.body.angularVelocity < 0){
            //rotating anti-clockwise
            if(this.aimAngle < 0){
                if(this.turret.angle < 0 && this.turret.angle <= this.aimAngle){
                    this.turret.setAngularVelocity(0);
                }
            } else if(this.aimAngle > 0) {
                if(this.turret.angle > 0 && this.turret.angle <= this.aimAngle){
                    this.turret.setAngularVelocity(0);
                }
            }
        }
    }
    
    aim(x:number, y:number){
        const angleBetweenTarget = Math.Angle.BetweenPoints(this.turret, { x, y });
        const moveToAngle = Math.Angle.WrapDegrees(Math.RadToDeg(angleBetweenTarget) + 90);
        this.aimAngle = moveToAngle;
        const differenceAngle = Math.Angle.ShortestBetween(this.turret.angle, moveToAngle);
        if(differenceAngle > 0){
            this.turret.setAngularVelocity(100);
        }else if(differenceAngle < 0){
            this.turret.setAngularVelocity(-100);
        }
    }
}