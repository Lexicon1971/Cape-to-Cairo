export const gameConfig = {
    mapWidth: 2400,
    mapHeight: 1800,
    startingGold: 5000,
    startingShips: 3,
    gridSize: 50,
};

export const ports = [
    { id: 'cairo', name: 'Cairo', x: 1200, y: 900, resources: ['grain', 'spice'] },
    { id: 'cape', name: 'Cape Town', x: 200, y: 200, resources: ['wine', 'timber'] },
    { id: 'alexandria', name: 'Alexandria', x: 1100, y: 800, resources: ['grain', 'wine'] },
    { id: 'zanzibar', name: 'Zanzibar', x: 1400, y: 500, resources: ['spice', 'ivory'] },
    { id: 'dar', name: 'Dar es Salaam', x: 1350, y: 400, resources: ['ivory', 'grain'] },
];

export const resourcePrices = {
    grain: { baseBuy: 10, baseSell: 15 },
    spice: { baseBuy: 50, baseSell: 80 },
    wine: { baseBuy: 20, baseSell: 35 },
    timber: { baseBuy: 15, baseSell: 25 },
    ivory: { baseBuy: 60, baseSell: 100 },
};
