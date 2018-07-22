import { Physics, Scene, Math as PMath } from 'phaser';
const { cos, sin } = Math;
const { Angle, RadToDeg, DegToRad } = PMath;
const { BetweenPoints, WrapDegrees, ShortestBetween } = Angle;

const SPEED = 50;

export class Tank {
    private turret: Physics.Arcade.Sprite;
    private chassis: Physics.Arcade.Sprite;
    private aimAngle: number;
    private driveAngle: number;

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

        if(this.chassis.body.angularVelocity > 0){
            // rotating clockwise
            if(this.driveAngle > 0){
                if(this.chassis.angle > 0 && this.chassis.angle >= this.driveAngle){
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            } else if(this.driveAngle < 0) {
                if(this.chassis.angle < 0 && this.chassis.angle >= this.driveAngle){
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            }
        }else if(this.chassis.body.angularVelocity < 0){
            //rotating anti-clockwise
            if(this.driveAngle < 0){
                if(this.chassis.angle < 0 && this.chassis.angle <= this.driveAngle){
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            } else if(this.driveAngle > 0) {
                if(this.chassis.angle > 0 && this.chassis.angle <= this.driveAngle){
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            }
        }
    }
    
    aim(worldX:number, worldY:number){
        const angleBetweenTarget = BetweenPoints(this.turret, { x: worldX, y: worldY });
        const moveToAngle = WrapDegrees(RadToDeg(angleBetweenTarget) + 90);
        this.aimAngle = moveToAngle;
        const differenceAngle = ShortestBetween(this.turret.angle, moveToAngle);
        if(differenceAngle > 0){
            this.turret.setAngularVelocity(100);
        }else if(differenceAngle < 0){
            this.turret.setAngularVelocity(-100);
        }
    }

    driveTo(worldX, worldY){
        // todo - once we add scenery/obstacles we'll need to do some pathfinding
        // lets think of this as a simple A->B path from current location
        // todo also aim(worldX, worldY) - if not engagedInCombat
        this.setVelocity(0);
        const angleBetweenTarget = BetweenPoints(this.chassis, { x: worldX, y: worldY });
        const moveToAngle = WrapDegrees(RadToDeg(angleBetweenTarget) + 90);
        this.driveAngle = moveToAngle;
        const differenceAngle = ShortestBetween(this.chassis.angle, moveToAngle);
        if(differenceAngle > 0){
            this.chassis.setAngularVelocity(100);
        }else if(differenceAngle < 0){
            this.chassis.setAngularVelocity(-100);
        }  
    }

    setVelocity(velocity: number){
        const angle = DegToRad(this.chassis.angle - 90);
        this.chassis.setVelocityX(velocity * cos(angle));
        this.chassis.setVelocityY(velocity * sin(angle));
        this.turret.setVelocityX(velocity * cos(angle));
        this.turret.setVelocityY(velocity * sin(angle));
    }
}