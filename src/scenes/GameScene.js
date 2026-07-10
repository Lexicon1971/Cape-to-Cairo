import Phaser from 'phaser';
import { gameConfig, ports, resourcePrices } from '../config/gameConfig';
import Ship from '../entities/Ship';
import Port from '../entities/Port';
import GameState from '../systems/GameState';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.gameState = new GameState();
        this.ships = [];
        this.portObjects = [];
        this.selectedShip = null;
    }

    create() {
        // Create background
        this.add.rectangle(
            gameConfig.mapWidth / 2,
            gameConfig.mapHeight / 2,
            gameConfig.mapWidth,
            gameConfig.mapHeight,
            0x1a4d7a
        );

        // Create ports
        ports.forEach((portData) => {
            const port = new Port(this, portData);
            this.portObjects.push(port);
        });

        // Create starting ships
        for (let i = 0; i < gameConfig.startingShips; i++) {
            const ship = new Ship(
                this,
                300 + i * 100,
                300,
                this.gameState
            );
            this.ships.push(ship);
            ship.setInteractive();
            this.input.setDraggable(ship);
        }

        // Setup camera
        this.cameras.main.setBounds(0, 0, gameConfig.mapWidth, gameConfig.mapHeight);
        this.physics.world.setBounds(0, 0, gameConfig.mapWidth, gameConfig.mapHeight);

        // Input handlers
        this.input.on('dragstart', (pointer, gameObject) => {
            if (gameObject instanceof Ship) {
                this.selectShip(gameObject);
            }
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer, gameObject) => {
            // Ship dropped at new location
            gameObject.updateDestination(gameObject.x, gameObject.y);
        });

        this.input.keyboard.on('keydown', (event) => {
            if (event.key === 'Escape') {
                this.deselectShip();
            }
        });

        // Update UI
        this.updateUI();
    }

    update() {
        // Update all ships
        this.ships.forEach((ship) => {
            ship.update();
        });

        // Check port collisions
        this.ships.forEach((ship) => {
            this.portObjects.forEach((port) => {
                if (
                    Phaser.Math.Distance.Between(
                        ship.x,
                        ship.y,
                        port.x,
                        port.y
                    ) < 50
                ) {
                    ship.arriveAtPort(port);
                }
            });
        });
    }

    selectShip(ship) {
        if (this.selectedShip) {
            this.selectedShip.setSelected(false);
        }
        this.selectedShip = ship;
        ship.setSelected(true);
        this.updateShipInfo();
    }

    deselectShip() {
        if (this.selectedShip) {
            this.selectedShip.setSelected(false);
            this.selectedShip = null;
            this.updateShipInfo();
        }
    }

    updateUI() {
        document.getElementById('gold').textContent = this.gameState.gold;
        document.getElementById('ships').textContent = this.ships.length;

        const portList = document.getElementById('portList');
        portList.innerHTML = ports
            .map(
                (p) =>
                    `<div style="margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px solid #444;">
                <div style="color: #0f0;">${p.name}</div>
                <div style="color: #666; font-size: 10px; margin-top: 2px;">${p.resources.join(', ')}</div>
            </div>`
            )
            .join('');
    }

    updateShipInfo() {
        const shipInfo = document.getElementById('shipInfo');
        if (this.selectedShip) {
            shipInfo.innerHTML = `
            <div style="color: #0f0; margin-bottom: 8px;">Ship ${this.selectedShip.id}</div>
            <div class="ui-stat">
                <span class="ui-label">Cargo:</span>
                <span class="ui-value">${this.selectedShip.cargo.weight}/${this.selectedShip.cargoCapacity}</span>
            </div>
            <div class="ui-stat">
                <span class="ui-label">Gold:</span>
                <span class="ui-value">${this.selectedShip.gold}</span>
            </div>
            <div style="color: #666; font-size: 10px; margin-top: 10px;">
                Drag to move | Right-click for trade
            </div>
        `;
        } else {
            shipInfo.innerHTML = 'Click a ship to select';
        }
    }
}
