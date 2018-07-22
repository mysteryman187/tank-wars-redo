import { Physics, Scene, Math as PMath } from 'phaser';
import { BattleScene } from './app.js';
import * as debounce from 'lodash.debounce';

const { cos, sin } = Math;
const { Angle, RadToDeg, DegToRad } = PMath;
const { BetweenPoints, WrapDegrees, ShortestBetween } = Angle;
const SPEED = 50;
const RANGE = 250; // todo should be a member based on type of tank
const BULLET_VELOCITY = 200;
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

    private target: Tank;

    constructor(private scene: BattleScene, private playerTank: boolean, x: number, y: number, type: 'hotchkiss' | 'panzer', otherTanksGroup: Physics.Arcade.Group) {
        this.fire = debounce(this.fire, FIRE_RATE, { maxWait: FIRE_RATE });
        this._generateSelectedTexture();
        this._generateHealthBar();
        this._generateRangeCircle();

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
        this.rangeCircle.body.setCircle(200);
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
                this.aim(this.target.chassis.x, this.target.chassis.y);
            }
        });
    }

    onClick(callback){
        this.chassis.on('pointerdown', callback);
    }

    _generateSelectedTexture(){
        const graphics = this.scene.add.graphics();
        graphics.clear();
        graphics.lineStyle(2, 0xFFFFFF, 1);

        const pad = 0;
        const quadLen = 6;
        const w = 64
        const h = 64;
        
        graphics.beginPath();
        graphics.moveTo(pad, pad + quadLen);
        graphics.lineTo(pad, pad);
        graphics.lineTo(pad + quadLen, pad);
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(w - (quadLen + pad), pad);
        graphics.lineTo(w - pad, pad);
        graphics.lineTo(w - pad, pad + quadLen);
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(w - pad, h - pad - quadLen);
        graphics.lineTo(w - pad, h - pad);
        graphics.lineTo(w - pad - quadLen, h - pad);
        graphics.strokePath();

        graphics.beginPath();
        graphics.moveTo(pad + quadLen, h - pad);
        graphics.lineTo(pad, h - pad);
        graphics.lineTo(pad, h - pad - quadLen);
        graphics.strokePath();

        graphics.generateTexture('selected-rect', w, h)
        graphics.clear();
        graphics.destroy();
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

    _generateRangeCircle(){
        const graphics = this.scene.add.graphics();
        graphics.clear();
        graphics.lineStyle(1, 0xFFFFFF, 0.05);
        const range = RANGE;
        graphics.strokeCircle(range, range, range)
        graphics.generateTexture('range-circle', range * 2, range * 2);
        graphics.clear();
    }

    fire(){
        const angle = DegToRad(this.turret.angle - 90);
        const projectile = this.scene.physics.add.sprite(this.x, this.y, null);
        projectile.setVelocityX(BULLET_VELOCITY * cos(angle));
        projectile.setVelocityY(BULLET_VELOCITY * sin(angle));
    }

    update() {
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
                    this.setVelocity(SPEED);
                }
            } else if (this.driveAngle < 0) {
                if (this.chassis.angle < 0 && this.chassis.angle >= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            }
        } else if (this.chassis.body.angularVelocity < 0) {
            //rotating anti-clockwise
            if (this.driveAngle < 0) {
                if (this.chassis.angle < 0 && this.chassis.angle <= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            } else if (this.driveAngle > 0) {
                if (this.chassis.angle > 0 && this.chassis.angle <= this.driveAngle) {
                    this.chassis.setAngularVelocity(0);
                    this.setVelocity(SPEED);
                }
            }
        }
    }

    aim(worldX: number, worldY: number) {
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

    driveTo(worldX, worldY) {
        // todo - once we add scenery/obstacles we'll need to do some pathfinding
        // lets think of this as a simple A->B path from current location
        // todo also aim(worldX, worldY) - if not engagedInCombat
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

        if (this.driveToGameObject) {
            this.driveToGameObject.destroy();
        }

        this.driveToGameObject = this.scene.physics.add.staticSprite(worldX, worldY, null);
        const radius = 5;
        this.driveToGameObject.body
            .setOffset(this.driveToGameObject.body.halfWidth - radius, this.driveToGameObject.body.halfHeight - radius)
            .setCircle(radius)

        this.driveToGameObject.setVisible(false);

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