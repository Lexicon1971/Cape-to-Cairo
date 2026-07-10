import { gameConfig, resourcePrices } from '../config/gameConfig';

export default class GameState {
    constructor() {
        this.gold = gameConfig.startingGold;
        this.ships = [];
        this.portfolio = {}; // Holds goods/resources
        this.portPrices = {}; // Dynamic prices at each port
        this.day = 1;
        this.initializePrices();
    }

    initializePrices() {
        // Each port has slightly different prices
        Object.keys(resourcePrices).forEach((resource) => {
            this.portPrices[resource] = { ...resourcePrices[resource] };
        });
    }

    updatePrices() {
        // Simulate market fluctuation
        Object.keys(this.portPrices).forEach((resource) => {
            const variation = (Math.random() - 0.5) * 5;
            this.portPrices[resource].baseBuy += variation;
            this.portPrices[resource].baseSell += variation;
        });
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
        this.updatePrices();
    }
}
