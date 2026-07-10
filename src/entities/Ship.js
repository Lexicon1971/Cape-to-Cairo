import Phaser from 'phaser';

let shipIdCounter = 1;

export default class Ship extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameState) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.id = shipIdCounter++;
        this.gameState = gameState;

        // Graphics
        this.displayWidth = 30;
        this.displayHeight = 40;
        this.body.setCollideWorldBounds(true);

        // Ship properties
        this.cargoCapacity = 100;
        this.cargo = { weight: 0, items: [] };
        this.gold = 500;
        this.speed = 200;
        this.maxSpeed = 200;

        // Navigation
        this.destinationX = x;
        this.destinationY = y;
        this.currentPort = null;
        this.isSelected = false;

        // Create graphics
        this.createGraphics();
    }

    createGraphics() {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffcc00, 1);
        graphics.fillRect(-15, -20, 30, 40);
        graphics.lineStyle(2, 0xffaa00, 1);
        graphics.strokeRect(-15, -20, 30, 40);
        graphics.generateTexture('ship', 30, 40);
        graphics.destroy();

        this.setTexture('ship');
    }

    updateDestination(x, y) {
        this.destinationX = x;
        this.destinationY = y;
        this.currentPort = null;
    }

    update() {
        if (!this.isSelected) {
            // Move towards destination
            const distance = Phaser.Math.Distance.Between(
                this.x,
                this.y,
                this.destinationX,
                this.destinationY
            );

            if (distance > 10) {
                const angle = Phaser.Math.Angle.Between(
                    this.x,
                    this.y,
                    this.destinationX,
                    this.destinationY
                );

                this.body.setVelocity(
                    Math.cos(angle) * this.maxSpeed,
                    Math.sin(angle) * this.maxSpeed
                );
                this.rotation = angle;
            } else {
                this.body.setVelocity(0, 0);
            }
        }
    }

    arriveAtPort(port) {
        if (this.currentPort !== port) {
            this.currentPort = port;
            this.body.setVelocity(0, 0);
            console.log(`Ship ${this.id} arrived at ${port.name}`);
        }
    }

    setSelected(selected) {
        this.isSelected = selected;
        if (selected) {
            this.setTint(0x00ff00);
        } else {
            this.clearTint();
        }
    }

    addCargo(item, amount) {
        const weight = amount; // Simplified
        if (this.cargo.weight + weight <= this.cargoCapacity) {
            this.cargo.items.push({ type: item, amount });
            this.cargo.weight += weight;
            return true;
        }
        return false;
    }

    removeCargo(item, amount) {
        const index = this.cargo.items.findIndex((i) => i.type === item);
        if (index !== -1) {
            const removed = Math.min(this.cargo.items[index].amount, amount);
            this.cargo.items[index].amount -= removed;
            this.cargo.weight -= removed;
            if (this.cargo.items[index].amount === 0) {
                this.cargo.items.splice(index, 1);
            }
            return removed;
        }
        return 0;
    }
}
