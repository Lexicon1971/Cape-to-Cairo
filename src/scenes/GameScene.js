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
        this.activeTab = 'trade'; // 'trade', 'build', 'bank'
        this.dayTimer = null;
    }

    create() {
        // Create map background (Africa stylized map)
        this.createMapGraphics();

        // Create ports
        ports.forEach((portData) => {
            const port = new Port(this, portData);
            this.portObjects.push(port);
        });

        // Create starting ships
        for (let i = 0; i < gameConfig.startingShips; i++) {
            // Distribute them near Cape Town or along the coast
            const ship = new Ship(
                this,
                450 + i * 40,
                1600 - i * 50,
                this.gameState
            );
            this.ships.push(ship);
            ship.setInteractive();
            this.input.setDraggable(ship);
        }
        // Save ships inside gameState as well
        this.gameState.ships = this.ships;

        // Setup camera and bounds
        this.cameras.main.setBounds(0, 0, gameConfig.mapWidth, gameConfig.mapHeight);
        this.physics.world.setBounds(0, 0, gameConfig.mapWidth, gameConfig.mapHeight);

        // Center camera initially near Cape Town / southern coast
        this.cameras.main.setScroll(200, 1000);

        // Input controls for camera drag
        this.setupCameraControls();

        // Ship Selection and dragging handlers
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
            gameObject.updateDestination(gameObject.x, gameObject.y);
            this.updateShipInfo();
            this.renderTabContent();
        });

        this.input.on('pointerdown', (pointer) => {
            // Click to set destination if a ship is selected
            if (this.selectedShip && !pointer.rightButtonDown()) {
                const worldPoint = pointer.positionToCamera(this.cameras.main);
                // Check if we clicked on a ship to select it instead of setting path
                let clickedShip = false;
                this.ships.forEach((ship) => {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(ship.getBounds(), new Phaser.Geom.Rectangle(worldPoint.x - 10, worldPoint.y - 10, 20, 20))) {
                        clickedShip = true;
                    }
                });

                if (!clickedShip) {
                    this.selectedShip.updateDestination(worldPoint.x, worldPoint.y);
                    this.updateShipInfo();
                    this.renderTabContent();
                }
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.deselectShip();
        });

        // Setup HTML UI controls
        this.setupUIControls();

        // Start Daily Tick Timer
        this.startDailyTick();

        // Initial UI Update
        this.updateUI();
        this.renderTabContent();
    }

    createMapGraphics() {
        // Deep blue ocean background
        this.add.rectangle(
            gameConfig.mapWidth / 2,
            gameConfig.mapHeight / 2,
            gameConfig.mapWidth,
            gameConfig.mapHeight,
            0x0f2027
        );

        // Let's draw a stylized outline of the East/South African Coastline from Cape to Cairo
        // Using coordinates that fit with our ports.
        // We will fill a custom polygon for land
        const landGraphics = this.add.graphics();
        landGraphics.fillStyle(0x1c3144, 1);
        landGraphics.lineStyle(4, 0x2b4c7e, 1);

        // Custom polygon representation of Africa landmass on our map coordinates
        // West/Left side is mostly land, East/Right side is sea.
        const points = [
            { x: 0, y: 0 },
            { x: 1200, y: 0 },
            { x: 620, y: 120 }, // Alexandria/Cairo area
            { x: 740, y: 200 },
            { x: 730, y: 350 }, // Red Sea area
            { x: 790, y: 400 },
            { x: 750, y: 550 }, // Horn of Africa
            { x: 860, y: 650 },
            { x: 800, y: 800 },
            { x: 830, y: 950 }, // East Coast down to Mozambique
            { x: 780, y: 1100 },
            { x: 780, y: 1300 },
            { x: 620, y: 1500 }, // South Africa curve
            { x: 400, y: 1650 }, // Cape Town
            { x: 0, y: 1800 }
        ];

        landGraphics.beginPath();
        landGraphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            landGraphics.lineTo(points[i].x, points[i].y);
        }
        landGraphics.closePath();
        landGraphics.fillPath();
        landGraphics.strokePath();

        // Grid lines to make it feel nautical/classic
        const gridGraphics = this.add.graphics();
        gridGraphics.lineStyle(1, 0xffffff, 0.04);
        for (let x = 0; x < gameConfig.mapWidth; x += 100) {
            gridGraphics.lineBetween(x, 0, x, gameConfig.mapHeight);
        }
        for (let y = 0; y < gameConfig.mapHeight; y += 100) {
            gridGraphics.lineBetween(0, y, gameConfig.mapWidth, y);
        }

        // Add map decorative text
        this.add.text(150, 400, 'LAND OF AFRICA', {
            fontFamily: 'Georgia',
            fontSize: '36px',
            color: 'rgba(255, 255, 255, 0.08)'
        }).setAngle(-45);

        this.add.text(850, 1300, 'INDIAN OCEAN', {
            fontFamily: 'Georgia',
            fontSize: '36px',
            color: 'rgba(255, 255, 255, 0.08)'
        }).setAngle(15);
    }

    setupCameraControls() {
        this.cameras.main.setZoom(1);

        let isDragging = false;
        let startX, startY;

        this.input.on('pointerdown', (pointer) => {
            // Check middle click or drag without ship selection
            if (pointer.middleButtonDown() || !this.selectedShip) {
                isDragging = true;
                startX = pointer.x;
                startY = pointer.y;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (isDragging) {
                const dx = pointer.x - startX;
                const dy = pointer.y - startY;
                this.cameras.main.scrollX -= dx;
                this.cameras.main.scrollY -= dy;
                startX = pointer.x;
                startY = pointer.y;
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });
    }

    startDailyTick() {
        if (this.dayTimer) this.dayTimer.destroy();

        this.dayTimer = this.time.addEvent({
            delay: 3000, // every 3 seconds represent 1 day
            callback: () => {
                if (this.gameState.isPlaying) {
                    this.gameState.nextDay();
                    this.updateUI();
                    this.renderTabContent();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    setupUIControls() {
        // Tab buttons
        const tabs = ['trade', 'build', 'bank'];
        tabs.forEach((tab) => {
            const btn = document.getElementById(`tab-${tab}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    tabs.forEach(t => document.getElementById(`tab-${t}`).classList.remove('active'));
                    btn.classList.add('active');
                    this.activeTab = tab;
                    this.renderTabContent();
                });
            }
        });

        // Play/Pause buttons
        const btnPlay = document.getElementById('btn-play');
        const btnPause = document.getElementById('btn-pause');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                this.gameState.isPlaying = true;
                btnPlay.style.backgroundColor = '#38b000';
                btnPause.style.backgroundColor = '#415a77';
            });
        }
        if (btnPause) {
            btnPause.addEventListener('click', () => {
                this.gameState.isPlaying = false;
                btnPlay.style.backgroundColor = '#415a77';
                btnPause.style.backgroundColor = '#ff4d4d';
            });
        }
    }

    update() {
        // Update all ships
        this.ships.forEach((ship) => {
            ship.update();
        });

        // Check port collisions/docking
        this.ships.forEach((ship) => {
            let insidePortRange = false;
            this.portObjects.forEach((port) => {
                const dist = Phaser.Math.Distance.Between(ship.x, ship.y, port.x, port.y);
                if (dist < 40) {
                    insidePortRange = true;
                    if (ship.currentPort !== port) {
                        ship.arriveAtPort(port);
                        if (ship === this.selectedShip) {
                            this.updateShipInfo();
                            this.renderTabContent();
                        }
                    }
                }
            });
            if (!insidePortRange && ship.currentPort) {
                ship.currentPort = null;
                if (ship === this.selectedShip) {
                    this.updateShipInfo();
                    this.renderTabContent();
                }
            }
        });
    }

    selectShip(ship) {
        if (this.selectedShip) {
            this.selectedShip.setSelected(false);
        }
        this.selectedShip = ship;
        ship.setSelected(true);
        this.updateShipInfo();
        this.renderTabContent();
    }

    deselectShip() {
        if (this.selectedShip) {
            this.selectedShip.setSelected(false);
            this.selectedShip = null;
            this.updateShipInfo();
            this.renderTabContent();
        }
    }

    updateUI() {
        // Update Gold and net worth
        document.getElementById('gold').textContent = this.gameState.gold;
        document.getElementById('net-worth').textContent = this.gameState.calculateNetWorth();
        document.getElementById('loans-val').textContent = this.gameState.loanAmount;
        document.getElementById('game-day').textContent = this.gameState.day;

        // Render port list status
        const portList = document.getElementById('portList');
        if (portList) {
            portList.innerHTML = ports
                .map((p) => {
                    const docked = this.ships.filter(s => s.currentPort && s.currentPort.id === p.id).length;
                    const dockedStr = docked > 0 ? `<span style="color: #ffd700;"> (${docked} Ship${docked > 1 ? 's' : ''} docked)</span>` : '';
                    return `<div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #415a77;">
                        <div class="flex-row">
                            <span style="color: #ffffff; font-weight: bold;">${p.name}</span>
                            <span style="font-size: 10px; color: #a3b18a;">Producing: ${p.resources.join(', ')}</span>
                        </div>
                        ${dockedStr}
                    </div>`;
                })
                .join('');
        }
    }

    updateShipInfo() {
        const shipInfo = document.getElementById('shipInfo');
        if (this.selectedShip) {
            const dockedAt = this.selectedShip.currentPort
                ? `<span style="color: #38b000;">Docked at ${this.selectedShip.currentPort.name}</span>`
                : `<span style="color: #ffd700;">Sailing...</span>`;

            shipInfo.innerHTML = `
                <div style="font-weight: bold; color: #f5b041; margin-bottom: 5px;">Ship ${this.selectedShip.id} (${dockedAt})</div>
                <div class="ui-stat">
                    <span class="ui-label">Cargo Space:</span>
                    <span class="ui-value">${this.selectedShip.getCargoWeight()}/${this.selectedShip.cargoCapacity}</span>
                </div>
                <div class="ui-stat">
                    <span class="ui-label">Ship's Coffers:</span>
                    <span class="ui-value" style="color: #ffd700;">${this.selectedShip.gold} Gold</span>
                </div>
                <div style="font-size: 10px; color: #a3b18a; margin-top: 5px; line-height: 1.2;">
                    * Left-Click map to Sail<br/>
                    * Drag ship to teleport<br/>
                    * ESC to deselect
                </div>
            `;
        } else {
            shipInfo.innerHTML = '<div style="color: #a3b18a; text-align: center; padding: 10px;">Click a ship on the map to select and trade</div>';
        }
    }

    renderTabContent() {
        const contentArea = document.getElementById('tab-content-area');
        if (!contentArea) return;

        if (!this.selectedShip) {
            contentArea.innerHTML = `
                <div id="interaction-instructions" style="color: #a3b18a; text-align: center; padding-top: 40px;">
                    Select a ship by clicking it to inspect cargo, trade, or build properties at its docked port.
                </div>`;
            return;
        }

        const port = this.selectedShip.currentPort;

        if (this.activeTab === 'trade') {
            if (!port) {
                contentArea.innerHTML = `
                    <div style="color: #ffd700; text-align: center; padding-top: 30px;">
                        Ship ${this.selectedShip.id} is currently at sea.<br/>
                        <span style="font-size: 11px; color: #a3b18a;">Sail to a port to buy and sell goods.</span>
                    </div>`;
                return;
            }

            // Render detailed trading layout
            let html = `<div style="font-size: 11px; margin-bottom: 8px; color: #a3b18a; border-bottom: 1px solid #415a77; padding-bottom: 4px;">
                Trading at <strong>${port.name}</strong>
            </div>`;

            Object.keys(resourcePrices).forEach((resKey) => {
                const res = resourcePrices[resKey];
                const market = this.gameState.portPrices[port.id][resKey];
                const shipAmt = this.selectedShip.cargo.items[resKey] || 0;
                const warehouseAmt = this.gameState.storedCargo[port.id][resKey] || 0;

                html += `
                <div class="trade-row">
                    <div class="trade-name">
                        ${res.name}
                        <div style="font-size: 9px; color: #888;">Ship: ${shipAmt} | Port: ${market.stock}</div>
                    </div>
                    <div class="trade-prices">
                        <span>Buy: <strong style="color: #ffd700;">${market.buy}g</strong></span>
                        <span>Sell: <strong style="color: #38b000;">${market.sell}g</strong></span>
                    </div>
                    <div class="trade-btns">
                        <button onclick="window.gameAction('buy', '${resKey}')" ${this.selectedShip.gold < market.buy || market.stock <= 0 || this.selectedShip.getCargoWeight() >= this.selectedShip.cargoCapacity ? 'disabled' : ''}>Buy</button>
                        <button onclick="window.gameAction('sell', '${resKey}')" ${shipAmt <= 0 ? 'disabled' : ''}>Sell</button>
                    </div>
                </div>`;
            });

            // Warehousing Section
            html += `
            <div style="font-size: 11px; margin-top: 15px; border-top: 1px solid #415a77; padding-top: 8px;">
                <strong>Port Warehouse Storage</strong> (Stores: ${this.gameState.properties[port.id].warehouse})
            </div>
            <div style="font-size: 10px; color: #a3b18a; margin-bottom: 8px;">Transfer goods between Ship and local Warehouse:</div>`;

            if (this.gameState.properties[port.id].warehouse <= 0) {
                html += `<div style="font-size: 10px; color: #ff4d4d; font-style: italic;">No warehouse built in ${port.name} yet. Build one in the Properties tab!</div>`;
            } else {
                Object.keys(resourcePrices).forEach((resKey) => {
                    const res = resourcePrices[resKey];
                    const shipAmt = this.selectedShip.cargo.items[resKey] || 0;
                    const warehouseAmt = this.gameState.storedCargo[port.id][resKey] || 0;

                    html += `
                    <div class="flex-row" style="margin-bottom: 4px; font-size: 11px;">
                        <span style="flex: 1;">${res.name}: ${warehouseAmt} stored</span>
                        <button style="padding: 2px 4px; font-size: 8px; margin-right: 2px;" onclick="window.gameAction('store', '${resKey}')" ${shipAmt <= 0 ? 'disabled' : ''}>Store 1</button>
                        <button style="padding: 2px 4px; font-size: 8px;" onclick="window.gameAction('retrieve', '${resKey}')" ${warehouseAmt <= 0 || this.selectedShip.getCargoWeight() >= this.selectedShip.cargoCapacity ? 'disabled' : ''}>Retrieve 1</button>
                    </div>`;
                });
            }

            contentArea.innerHTML = html;

        } else if (this.activeTab === 'build') {
            if (!port) {
                contentArea.innerHTML = `
                    <div style="color: #ffd700; text-align: center; padding-top: 30px;">
                        Ship ${this.selectedShip.id} is currently at sea.<br/>
                        <span style="font-size: 11px; color: #a3b18a;">Dock at a port to build properties.</span>
                    </div>`;
                return;
            }

            const pProps = this.gameState.properties[port.id];

            contentArea.innerHTML = `
                <div style="font-size: 11px; margin-bottom: 8px; color: #a3b18a; border-bottom: 1px solid #415a77; padding-bottom: 4px;">
                    Constructing in <strong>${port.name}</strong>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Warehouse (1000g)</strong>
                        <span>Qty: ${pProps.warehouse}</span>
                    </div>
                    <div style="font-size: 9px; color: #a3b18a; margin-bottom: 4px;">Enables storage of trade goods locally.</div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'warehouse')" ${this.gameState.gold < 1000 ? 'disabled' : ''}>Build Warehouse</button>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Store / Shop (1500g)</strong>
                        <span>Qty: ${pProps.store}</span>
                    </div>
                    <div style="font-size: 9px; color: #a3b18a; margin-bottom: 4px;">Sells local goods directly to port residents over time.</div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'store')" ${this.gameState.gold < 1500 ? 'disabled' : ''}>Build Store</button>
                </div>

                <div style="font-weight: bold; font-size: 11px; margin-top: 10px; color: #f5b041;">Production Facilities:</div>
                <div style="font-size: 9px; color: #a3b18a; margin-bottom: 6px;">Produces resources directly into your warehouse daily!</div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Grain Farm (1200g)</strong>
                        <span>Qty: ${pProps.grainFarm}</span>
                    </div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'grainFarm')" ${this.gameState.gold < 1200 || pProps.warehouse <= 0 ? 'disabled' : ''}>Build Grain Farm</button>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Spice Plantation (2000g)</strong>
                        <span>Qty: ${pProps.spicePlantation}</span>
                    </div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'spicePlantation')" ${this.gameState.gold < 2000 || pProps.warehouse <= 0 ? 'disabled' : ''}>Build Spice Plantation</button>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Vineyard (1600g)</strong>
                        <span>Qty: ${pProps.vineyard}</span>
                    </div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'vineyard')" ${this.gameState.gold < 1600 || pProps.warehouse <= 0 ? 'disabled' : ''}>Build Vineyard</button>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Timber Camp (1400g)</strong>
                        <span>Qty: ${pProps.timberCamp}</span>
                    </div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'timberCamp')" ${this.gameState.gold < 1400 || pProps.warehouse <= 0 ? 'disabled' : ''}>Build Timber Camp</button>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <strong>Ivory Camp (2500g)</strong>
                        <span>Qty: ${pProps.ivoryCamp}</span>
                    </div>
                    <button style="width: 100%;" onclick="window.gameAction('build_item', 'ivoryCamp')" ${this.gameState.gold < 2500 || pProps.warehouse <= 0 ? 'disabled' : ''}>Build Ivory Camp</button>
                </div>
            `;

        } else if (this.activeTab === 'bank') {
            this.gameState.calculateNetWorth(); // update limits

            contentArea.innerHTML = `
                <div style="font-size: 11px; margin-bottom: 8px; color: #a3b18a; border-bottom: 1px solid #415a77; padding-bottom: 4px;">
                    <strong>Imperial Bank of East Africa</strong>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <span><strong>Borrow Gold</strong></span>
                        <span style="font-size: 10px; color: #ff4d4d;">1% daily interest</span>
                    </div>
                    <div style="font-size: 9px; color: #a3b18a; margin-top: 4px; margin-bottom: 6px;">
                        Max Limit: <strong style="color: #ffd700;">${this.gameState.creditRating}g</strong><br/>
                        Current Loan: <strong style="color: #ff4d4d;">${this.gameState.loanAmount}g</strong>
                    </div>
                    <div class="flex-row" style="gap: 5px;">
                        <button style="flex: 1;" onclick="window.gameAction('borrow', 1000)" ${this.gameState.loanAmount + 1000 > this.gameState.creditRating ? 'disabled' : ''}>+1000g</button>
                        <button style="flex: 1;" onclick="window.gameAction('repay', 1000)" ${this.gameState.loanAmount < 1000 || this.gameState.gold < 1000 ? 'disabled' : ''}>Repay 1000g</button>
                    </div>
                </div>

                <div class="bank-option">
                    <div class="flex-row">
                        <span><strong>Deposit / Savings</strong></span>
                        <span style="font-size: 10px; color: #38b000;">0.2% daily interest</span>
                    </div>
                    <div style="font-size: 9px; color: #a3b18a; margin-top: 4px; margin-bottom: 6px;">
                        Safekeeping and passive growth.<br/>
                        Deposited: <strong style="color: #38b000;">${this.gameState.depositAmount}g</strong>
                    </div>
                    <div class="flex-row" style="gap: 5px;">
                        <button style="flex: 1;" onclick="window.gameAction('deposit', 1000)" ${this.gameState.gold < 1000 ? 'disabled' : ''}>Deposit 1000</button>
                        <button style="flex: 1;" onclick="window.gameAction('withdraw', 1000)" ${this.gameState.depositAmount < 1000 ? 'disabled' : ''}>Withdraw 1000</button>
                    </div>
                </div>
            `;
        }
    }

    // Exposed execution API for DOM onClick handlers
    handleGameAction(action, data) {
        if (!this.selectedShip) return;
        const port = this.selectedShip.currentPort;

        if (action === 'buy') {
            const market = this.gameState.portPrices[port.id][data];
            if (this.selectedShip.gold >= market.buy && market.stock > 0) {
                if (this.selectedShip.addCargo(data, 1)) {
                    this.selectedShip.gold -= market.buy;
                    market.stock--;
                    // Supply and demand update
                    const base = resourcePrices[data];
                    const produces = port.resources.includes(data);
                    const baseBuy = produces ? base.baseBuy * 0.75 : base.baseBuy * 1.25;
                    const stockFactor = Math.max(0.2, 2.0 - (market.stock / 40));
                    market.buy = Math.max(2, Math.floor(baseBuy * stockFactor));
                    market.sell = Math.max(market.buy + 1, Math.floor(produces ? base.baseSell * 0.75 : base.baseSell * 1.25 * stockFactor));
                }
            }
        } else if (action === 'sell') {
            const market = this.gameState.portPrices[port.id][data];
            if (this.selectedShip.removeCargo(data, 1) > 0) {
                this.selectedShip.gold += market.sell;
                market.stock++;
                // Supply and demand update
                const base = resourcePrices[data];
                const produces = port.resources.includes(data);
                const baseBuy = produces ? base.baseBuy * 0.75 : base.baseBuy * 1.25;
                const stockFactor = Math.max(0.2, 2.0 - (market.stock / 40));
                market.buy = Math.max(2, Math.floor(baseBuy * stockFactor));
                market.sell = Math.max(market.buy + 1, Math.floor(produces ? base.baseSell * 0.75 : base.baseSell * 1.25 * stockFactor));
            }
        } else if (action === 'store') {
            if (this.selectedShip.removeCargo(data, 1) > 0) {
                this.gameState.storedCargo[port.id][data]++;
            }
        } else if (action === 'retrieve') {
            if (this.gameState.storedCargo[port.id][data] > 0) {
                if (this.selectedShip.addCargo(data, 1)) {
                    this.gameState.storedCargo[port.id][data]--;
                }
            }
        } else if (action === 'build_item') {
            let cost = 0;
            if (data === 'warehouse') cost = 1000;
            else if (data === 'store') cost = 1500;
            else if (data === 'grainFarm') cost = 1200;
            else if (data === 'spicePlantation') cost = 2000;
            else if (data === 'vineyard') cost = 1600;
            else if (data === 'timberCamp') cost = 1400;
            else if (data === 'ivoryCamp') cost = 2500;

            if (this.gameState.removeGold(cost)) {
                this.gameState.properties[port.id][data]++;
            }
        } else if (action === 'borrow') {
            this.gameState.calculateNetWorth();
            if (this.gameState.loanAmount + data <= this.gameState.creditRating) {
                this.gameState.loanAmount += data;
                this.gameState.addGold(data);
            }
        } else if (action === 'repay') {
            if (this.gameState.loanAmount >= data && this.gameState.removeGold(data)) {
                this.gameState.loanAmount -= data;
            }
        } else if (action === 'deposit') {
            if (this.gameState.removeGold(data)) {
                this.gameState.depositAmount += data;
            }
        } else if (action === 'withdraw') {
            if (this.gameState.depositAmount >= data) {
                this.gameState.depositAmount -= data;
                this.gameState.addGold(data);
            }
        }

        this.updateUI();
        this.updateShipInfo();
        this.renderTabContent();
    }
}

// Bind to window so HTML inline click events work beautifully
window.gameAction = (action, data) => {
    const scene = window.phaserGameScene;
    if (scene) {
        scene.handleGameAction(action, data);
    }
};
