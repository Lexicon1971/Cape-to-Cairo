import Phaser from 'phaser';

let shipIdCounter = 1;

export default class Ship extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameState) {
        super(scene, x, y);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.id = shipIdCounter++;
        this.gameState = gameState;

        // Graphics / Dimensions
        this.displayWidth = 24;
        this.displayHeight = 32;
        this.body.setCollideWorldBounds(true);

        // Ship properties based on Patrician III
        this.cargoCapacity = 100;
        // We represent cargo items as a key-value map (e.g. { grain: 5, spice: 10 })
        this.cargo = { weight: 0, items: {} };
        this.gold = 1000; // Ships have local cash pools
        this.speed = 150;
        this.maxSpeed = 150;

        // Navigation
        this.destinationX = x;
        this.destinationY = y;
        this.currentPort = null;
        this.isSelected = false;

        // Create texture
        this.createGraphics();
    }

    createGraphics() {
        // Draw a classic sailing boat shape (triangular sails)
        const graphics = this.scene.add.graphics();

        // Hull
        graphics.fillStyle(0x8b4513, 1);
        graphics.beginPath();
        graphics.moveTo(0, -16);
        graphics.lineTo(12, -4);
        graphics.lineTo(8, 16);
        graphics.lineTo(-8, 16);
        graphics.lineTo(-12, -4);
        graphics.closePath();
        graphics.fillPath();

        // Sails (White)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(-2, -8, 4, 16);
        graphics.beginPath();
        graphics.moveTo(0, -12);
        graphics.lineTo(10, 0);
        graphics.lineTo(0, 4);
        graphics.closePath();
        graphics.fillPath();

        // Generate texture key
        graphics.generateTexture('ship-texture-' + this.id, 24, 32);
        graphics.destroy();

        this.setTexture('ship-texture-' + this.id);
    }

    updateDestination(x, y) {
        this.destinationX = x;
        this.destinationY = y;
        this.currentPort = null;
    }

    update() {
        // Move towards destination
        const distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.destinationX,
            this.destinationY
        );

        if (distance > 15) {
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
            this.rotation = angle + Math.PI / 2; // Face direction of travel
        } else {
            this.body.setVelocity(0, 0);
            if (!this.currentPort) {
                this.x = this.destinationX;
                this.y = this.destinationY;
            }
        }
    }

    arriveAtPort(port) {
        if (this.currentPort !== port) {
            this.currentPort = port;
            this.destinationX = port.x;
            this.destinationY = port.y;
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

    getCargoWeight() {
        let total = 0;
        Object.keys(this.cargo.items).forEach((item) => {
            total += this.cargo.items[item];
        });
        this.cargo.weight = total;
        return total;
    }

    addCargo(item, amount) {
        const currentWeight = this.getCargoWeight();
        if (currentWeight + amount <= this.cargoCapacity) {
            this.cargo.items[item] = (this.cargo.items[item] || 0) + amount;
            this.cargo.weight = this.getCargoWeight();
            return true;
        }
        return false;
    }

    removeCargo(item, amount) {
        const currentAmount = this.cargo.items[item] || 0;
        if (currentAmount >= amount) {
            this.cargo.items[item] -= amount;
            if (this.cargo.items[item] === 0) {
                delete this.cargo.items[item];
            }
            this.cargo.weight = this.getCargoWeight();
            return amount;
        }
        return 0;
    }
}
