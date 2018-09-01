import { Scene } from 'phaser';

export const lobbyRectangle = (scene:Scene) => {
    const graphics = scene.add.graphics();
    graphics.clear();
    graphics.lineStyle(2, 0x111111, 1);

    const { width } = scene.cameras.main;
    const height = 480;
    graphics.strokeRect(0, 0, width - 100, height );
    graphics.generateTexture('lobby-rect', width, height)
    graphics.clear();
    graphics.destroy();
}


export const selectedRectangle = (scene:Scene) => {
    const graphics = scene.add.graphics();
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

export const rangeCircle = (scene:Scene, range) => {
    const graphics = scene.add.graphics();
    graphics.clear();
    graphics.lineStyle(1, 0xFFFFFF, 0.5);
    graphics.strokeCircle(range, range, range)
    graphics.generateTexture('range-circle', range * 2, range * 2);
    graphics.clear();
    graphics.destroy();
}

export const projectile = (scene:Scene) => {
    const graphics = scene.add.graphics();
    graphics.clear();
    const r = 5;
    graphics.fillStyle(0x222222, 1);
    graphics.fillCircle(r, r, r)
    graphics.generateTexture('projectile', r * 2, r * 2);
    graphics.clear();
    graphics.destroy();
}

export const generateHealthBars = (scene:Scene) => {
        const graphics = scene.add.graphics();
        for(let i = 0; i <= 100; i+=5){
            graphics.clear();
            graphics.lineStyle(2, 0xFFFFFF, 1);
            graphics.fillStyle(0x12DD20);
            const pad = 0;
            const w = 64;
            const h = 7;
            graphics.fillRect(pad, pad, (w * i) / 100, h);
            graphics.strokeRect(pad, pad, w, h);
            const texture = graphics.generateTexture(`health-bar-${i}`, w, h);
            graphics.clear();
        }
    }