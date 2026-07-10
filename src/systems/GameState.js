import { gameConfig, resourcePrices, ports } from '../config/gameConfig';

export default class GameState {
    constructor() {
        this.gold = gameConfig.startingGold;
        this.ships = [];
        this.day = 1;
        this.isPlaying = true;

        // Detailed economics, production, warehousing and banking
        this.portPrices = {};       // portPrices[portId][resource] = { buy, sell, stock }
        this.properties = {};       // properties[portId] = { warehouse: 0, store: 0, grainFarm: 0, spicePlantation: 0, vineyard: 0, timberCamp: 0, ivoryCamp: 0 }
        this.storedCargo = {};      // storedCargo[portId] = { grain: 0, spice: 0, wine: 0, timber: 0, ivory: 0 }

        // Banking system
        this.loanAmount = 0;
        this.depositAmount = 0;
        this.creditRating = 10000; // max loan limit based on assets

        this.initializeState();
    }

    initializeState() {
        // Initialize port specific market prices & stock levels
        ports.forEach((port) => {
            this.portPrices[port.id] = {};
            this.properties[port.id] = {
                warehouse: 0,
                store: 0,
                grainFarm: 0,
                spicePlantation: 0,
                vineyard: 0,
                timberCamp: 0,
                ivoryCamp: 0
            };
            this.storedCargo[port.id] = {
                grain: 0,
                spice: 0,
                wine: 0,
                timber: 0,
                ivory: 0
            };

            Object.keys(resourcePrices).forEach((res) => {
                const base = resourcePrices[res];
                // Ports that naturally list resources produce them (high stock, lower buy price)
                const produces = port.resources.includes(res);
                const stock = produces ? 50 + Math.floor(Math.random() * 50) : 5 + Math.floor(Math.random() * 15);

                const factor = produces ? 0.75 : 1.25;
                const buyPrice = Math.max(2, Math.floor(base.baseBuy * factor + (Math.random() - 0.5) * 2));
                const sellPrice = Math.max(buyPrice + 1, Math.floor(base.baseSell * factor + (Math.random() - 0.5) * 4));

                this.portPrices[port.id][res] = {
                    buy: buyPrice,
                    sell: sellPrice,
                    stock: stock
                };
            });
        });
    }

    updatePricesAndStock() {
        // Daily tick update
        ports.forEach((port) => {
            Object.keys(resourcePrices).forEach((res) => {
                const market = this.portPrices[port.id][res];
                const produces = port.resources.includes(res);

                // Natural production of port resources
                if (produces) {
                    market.stock += 2;
                } else {
                    // Natural consumption of non-produced resources
                    if (market.stock > 0 && Math.random() < 0.4) {
                        market.stock--;
                    }
                }

                // Add production from player-owned buildings
                const buildings = this.properties[port.id];
                if (res === 'grain' && buildings.grainFarm > 0) {
                    this.storedCargo[port.id].grain += buildings.grainFarm * 5;
                }
                if (res === 'spice' && buildings.spicePlantation > 0) {
                    this.storedCargo[port.id].spice += buildings.spicePlantation * 2;
                }
                if (res === 'wine' && buildings.vineyard > 0) {
                    this.storedCargo[port.id].wine += buildings.vineyard * 3;
                }
                if (res === 'timber' && buildings.timberCamp > 0) {
                    this.storedCargo[port.id].timber += buildings.timberCamp * 4;
                }
                if (res === 'ivory' && buildings.ivoryCamp > 0) {
                    this.storedCargo[port.id].ivory += buildings.ivoryCamp * 1;
                }

                // Recalculate prices based on supply and demand
                // Higher stock -> lower price. Lower stock -> higher price.
                const base = resourcePrices[res];
                const baseBuy = produces ? base.baseBuy * 0.75 : base.baseBuy * 1.25;
                const baseSell = produces ? base.baseSell * 0.75 : base.baseSell * 1.25;

                // Demand curve modifier
                const stockFactor = Math.max(0.2, 2.0 - (market.stock / 40));
                market.buy = Math.max(2, Math.floor(baseBuy * stockFactor));
                market.sell = Math.max(market.buy + 1, Math.floor(baseSell * stockFactor));
            });
        });
    }

    calculateNetWorth() {
        let value = this.gold + this.depositAmount - this.loanAmount;
        // Add building asset values
        ports.forEach((port) => {
            const b = this.properties[port.id];
            value += (b.warehouse * 1000);
            value += (b.store * 1500);
            value += (b.grainFarm * 1200);
            value += (b.spicePlantation * 2000);
            value += (b.vineyard * 1600);
            value += (b.timberCamp * 1400);
            value += (b.ivoryCamp * 2500);

            // Add stored cargo value at base prices
            const cargo = this.storedCargo[port.id];
            Object.keys(cargo).forEach((res) => {
                value += cargo[res] * resourcePrices[res].baseBuy;
            });
        });

        // Add ship values (say 2000 gold per ship plus their cargo)
        this.ships.forEach((ship) => {
            value += 2000;
            value += ship.gold;
            Object.keys(ship.cargo.items).forEach((res) => {
                value += ship.cargo.items[res] * resourcePrices[res].baseBuy;
            });
        });

        this.creditRating = Math.max(5000, Math.floor(value * 0.5));
        return value;
    }

    addGold(amount) {
        this.gold += amount;
    }

    removeGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    nextDay() {
        this.day++;

        // Handle bank interests daily
        if (this.loanAmount > 0) {
            // 1% daily interest on loans
            const interest = Math.ceil(this.loanAmount * 0.01);
            this.loanAmount += interest;
        }
        if (this.depositAmount > 0) {
            // 0.2% daily interest on deposits
            const interest = Math.floor(this.depositAmount * 0.002);
            this.depositAmount += interest;
        }

        this.updatePricesAndStock();
    }
}
