export class Stage {
    constructor(name) {
        this.name = name;
        this.background = this.createBackground();
    }
    
    createBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        const ctx = canvas.getContext('2d');
        
        // Dessin du décor
        const skyGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#1E90FF');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, GROUND_LEVEL, GAME_WIDTH, GAME_HEIGHT - GROUND_LEVEL);
        
        return canvas;
    }
    
    render(ctx) {
        ctx.drawImage(this.background, 0, 0);
    }
}