import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import { gameConfig } from './config/gameConfig';

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: window.innerWidth - 250,
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

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth - 250, window.innerHeight);
});
