import { Physics, Scene, Math as PMath } from 'phaser';
import { BattleScene } from './app.js';
import * as debounce from 'lodash.debounce';

const { cos, sin } = Math;
const { Angle, RadToDeg, DegToRad } = PMath;
const { BetweenPoints, WrapDegrees, ShortestBetween } = Angle;
const SPEED = 50;
export const RANGE = 250; // todo should be a member based on type of tank
const BULLET_VELOCITY = 400;
const FIRE_RATE = 3000; // 1 per second 2000 for 1 per 2 seconds etc

export class Tank {
    private turret: Physics.Arcade.Sprite;
    public chassis: Physics.Arcade.Sprite;
    private selectionRect: Physics.Arcade.Sprite;
    private healthBar:Physics.Arcade.Sprite;

    private aimAngle: number;
    private driveAngle: number;
    private tankMoveGameObject: Physics.Arcade.Sprite;
    private driveToGameObject: Physics.Arcade.Sprite;

    private rangeCircle: Physics.Arcade.Sprite;

    private health:number = 100;
    private maxHealth:number = 100;

    public target: Tank;
    private destroyed: boolean;

    constructor(private scene: BattleScene, private playerTank: boolean, x: number, y: number, type: 'hotchkiss' | 'panzer', private otherTanksGroup: Physics.Arcade.Group) {
        this.fire = debounce(this.fire, FIRE_RATE, { maxWait: FIRE_RATE, leading: true });
        this._generateHealthBar();

        this.chassis = scene.physics.add.sprite(x, y, `${type}-chassis`);
        if(type === 'panzer'){
            y = y-10;
        }
        this.turret = scene.physics.add.sprite(x, y, `${type}-turret`);

        this.chassis.setInteractive();

        this.selectionRect = scene.physics.add.sprite(x, y, 'selected-rect');
        this.selectionRect.setVisible(false);
        this.healthBar = scene.physics.add.sprite(x, y - this.chassis.body.halfHeight - 7, 'health-bar');
        this.hideHealth();

        this.rangeCircle = scene.physics.add.sprite(x, y, 'range-circle');
        this.rangeCircle.body.setCircle(RANGE);
        this.hideRangeCircle();

        this.tankMoveGameObject = this.scene.physics.add.sprite(x, y, null);
        const radius = 10;
        this.tankMoveGameObject.body
            .setOffset(this.tankMoveGameObject.body.halfWidth - radius, this.tankMoveGameObject.body.halfHeight - radius)
            .setCircle(radius);
        this.tankMoveGameObject.setVisible(false);

        this.chassis.on('pointerover', () => {
            this.showHealth();
            this.showRangeCircle();
        });
        this.chassis.on('pointerout', () => {
            this.hideHealth();
            this.hideRangeCircle();
        });
        this.scene.physics.add.overlap(this.rangeCircle, otherTanksGroup, (circle, enemyChassis ) => {
            if(!this.target){
                this.target = this.scene.resolveTank(enemyChassis);
            }

            if(this.target){
                this.aim(this.target.chassis.x, this.target.chassis.y, this.isIdle());
            }
        });
    }

    isIdle(){
        const velocity = this.chassis.body.velocity;
        return velocity.x === 0 && velocity.y === 0;
    }

    isMoving(){
        return !this.isIdle();
    }
    onClick(callback){
        this.chassis.on('pointerdown', callback);
    }
   
    _generateHealthBar(){
        const graphics = this.scene.add.graphics();
        graphics.clear();
        graphics.lineStyle(2, 0xFFFFFF, 1);
        graphics.fillStyle(0x12DD20);
        const pad = 0;
        const w = 64;
        const h = 7;
        const { health, maxHealth } = this;
        graphics.fillRect(pad, pad, (w * this.health) / this.maxHealth, h);
        graphics.strokeRect(pad, pad, w, h);
        const texture = graphics.generateTexture('health-bar', w, h);
        graphics.clear();
        return graphics;     
    }

    fire(){
        if(this.target){
            const angle = DegToRad(this.turret.angle - 90);
            const projectile = this.scene.physics.add.sprite(this.x, this.y, 'projectile');
    
            projectile.setVelocityX(BULLET_VELOCITY * cos(angle));
            projectile.setVelocityY(BULLET_VELOCITY * sin(angle));
    
            this.scene.physics.add.overlap(projectile, this.target.chassis, (p, enemyChassis ) => {
                projectile.destroy(); 
                const hitTank = this.scene.resolveTank(enemyChassis);
                if(hitTank){
                    hitTank.takeDamage();
                }
            });
        }
    }
    takeDamage(){
        if(this.playerTank){
            // someone hit me
            // todo send a mesage that i was hit
            this.health-=10;
        } else {
            // i hit an enemy - i wont reduce enemy health until i get a message to do so
            // todo - dont do this locally
            this.health-=10
        }
        this._generateHealthBar();
        this.checkForDeath();
    }
    checkForDeath(){
        console.log('checking ', this.health);
        if(this.health <= 0 ){
            // todo destroy this tank
            this.destroy();
            if(this.playerTank){
                // todo send a message that i was detroyed
            }
        }
    }
    destroy(){
        this.destroyed = true;
        // todo explosion animation first!
        this.chassis.destroy();
        this.turret.destroy();
        this.healthBar.destroy();
        this.selectionRect.destroy();
        if(this.driveToGameObject){
            this.driveToGameObject.destroy();
        }
        this.tankMoveGameObject.destroy();
        this.rangeCircle.destroy();
        this.scene.removeTank(this);
    }
    update() {
        if(this.destroyed){
            return;
        }
        if (this.turret.body.angularVelocity > 0) {
            // rotating clockwise
            if (this.aimAngle > 0) {
                if (this.turret.angle > 0 && this.turret.angle >= this.aimAngle) {
                    this.turret.setAngularVelocity(0);
                    this.fire();
                }
            } else if (this.aimAngle < 0) {
                if (this.turret.angle < 0 && this.turret.angle >= this.aimAngle) {
                    this.turret.setAngularVelocity(0);
                    this.fire();
                }
            }
        } else if (this.turret.body.angularVelocity < 0) {
            //rotating anti-clockwise
            if (this.aimAngle < 0) {
                if (this.turret.angle < 0 && this.turret.angle <= this.aimAngle) {
                    this.turret.setAngularVelocity(0);
                    this.fire();
                }
            } else if (this.aimAngle > 0) {
                if (this.turret.angle > 0 && this.turret.angle <= this.aimAngle) {
                    this.turret.setAngularVelocity(0);
                    this.fire();
                }
            }
        }

        if (this.chassis.body.angularVelocity > 0) {
            // rotating clockwise           
            if (this.driveAngle > 0) {
                if (this.chassis.angle > 0 && this.chassis.angle >= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    if(this.driveToGameObject){
                        this.setVelocity(SPEED);
                    }
                }
            } else if (this.driveAngle < 0) {
                if (this.chassis.angle < 0 && this.chassis.angle >= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    if(this.driveToGameObject){
                        this.setVelocity(SPEED);
                    }
                }
            }
        } else if (this.chassis.body.angularVelocity < 0) {
            //rotating anti-clockwise
            if (this.driveAngle < 0) {
                if (this.chassis.angle < 0 && this.chassis.angle <= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    if(this.driveToGameObject){
                        this.setVelocity(SPEED);
                    }
                }
            } else if (this.driveAngle > 0) {
                if (this.chassis.angle > 0 && this.chassis.angle <= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    if(this.driveToGameObject){
                        this.setVelocity(SPEED);
                    }
                }
            }
        }
    }

    aim(worldX: number, worldY: number, stopAndAimChasis:boolean = false) {
        
        if(stopAndAimChasis){
            this.aimChassis(worldX, worldY);
        }

        const angleBetweenTarget = BetweenPoints(this.turret, { x: worldX, y: worldY });
        const moveToAngle = WrapDegrees(RadToDeg(angleBetweenTarget) + 90);
        this.aimAngle = moveToAngle;
        const differenceAngle = ShortestBetween(this.turret.angle, moveToAngle);
        if (differenceAngle > 0) {
            this.turret.setAngularVelocity(100);
        } else if (differenceAngle < 0) {
            this.turret.setAngularVelocity(-100);
        }
    }

    aimChassis(worldX, worldY){
        this.setVelocity(0);
        const angleBetweenTarget = BetweenPoints(this.chassis, { x: worldX, y: worldY });
        const moveToAngle = WrapDegrees(RadToDeg(angleBetweenTarget) + 90);
        this.driveAngle = moveToAngle;
        const differenceAngle = ShortestBetween(this.chassis.angle, moveToAngle);
        if (differenceAngle > 0) {
            this.chassis.setAngularVelocity(100);
        } else if (differenceAngle < 0) {
            this.chassis.setAngularVelocity(-100);
        }
    }
    driveTo(worldX, worldY) {
        // todo - once we add scenery/obstacles we'll need to do some pathfinding
        // lets think of this as a simple A->B path from current location
        // todo also aim(worldX, worldY) - if not engagedInCombat
      
        this.aimChassis(worldX, worldY);

        if (this.driveToGameObject) {
            this.driveToGameObject.destroy();
        }

        // make a hidden sprite at the point we want to drive to
        this.driveToGameObject = this.scene.physics.add.staticSprite(worldX, worldY, null);
        const radius = 5;
        this.driveToGameObject.body
            .setOffset(this.driveToGameObject.body.halfWidth - radius, this.driveToGameObject.body.halfHeight - radius)
            .setCircle(radius)

        this.driveToGameObject.setVisible(false);

        // when we overlap then we got there
        this.scene.physics.add.overlap(this.tankMoveGameObject, this.driveToGameObject, () => {
            this.setVelocity(0);
            this.driveToGameObject.destroy();
        });
    }

    setVelocity(velocity: number) {
        const angle = DegToRad(this.chassis.angle - 90);
        const setVelocity = o => {
            o.setVelocityX(velocity * cos(angle));
            o.setVelocityY(velocity * sin(angle));
        };
        setVelocity(this.chassis);
        setVelocity(this.turret);
        setVelocity(this.tankMoveGameObject);
        setVelocity(this.selectionRect);
        setVelocity(this.healthBar.body);
        setVelocity(this.rangeCircle);
    }

    public set selected(value:boolean){
        this.selectionRect.setVisible(value);
        this.healthBar.setVisible(value);
        this.rangeCircle.setVisible(value);
    }

    public get selected() : boolean {
        return this.selectionRect.visible;
    }
    public showHealth(){
        this.healthBar.setVisible(true);
    }
    public hideHealth(){
        if(!this.selected){
            this.healthBar.setVisible(false);
        }
    }

    public showRangeCircle(){
        this.rangeCircle.setVisible(true);
    }
    public hideRangeCircle(){
        if(!this.selected){
            this.rangeCircle.setVisible(false);
        }
    }

    get x (){
        return this.chassis.x;
    }
    get y(){
        return this.chassis.y;
    }
}