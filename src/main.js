import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth - 320,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scene: [GameScene],
};

const game = new Phaser.Game(config);

// Save the active scene on game boot/creation
game.events.once('ready', () => {
    const scene = game.scene.getScene('GameScene');
    window.phaserGameScene = scene;
});

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth - 320, window.innerHeight);
});
