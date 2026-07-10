export const gameConfig = {
    mapWidth: 1200,
    mapHeight: 1800,
    startingGold: 5000,
    startingShips: 3,
};

export const ports = [
    { id: 'cairo', name: 'Cairo', x: 750, y: 150, resources: ['grain', 'spice'] },
    { id: 'alexandria', name: 'Alexandria', x: 680, y: 100, resources: ['grain', 'wine'] },
    { id: 'port_sudan', name: 'Port Sudan', x: 800, y: 450, resources: ['ivory', 'spice'] },
    { id: 'mombasa', name: 'Mombasa', x: 880, y: 920, resources: ['timber', 'grain'] },
    { id: 'zanzibar', name: 'Zanzibar', x: 910, y: 1000, resources: ['spice', 'ivory'] },
    { id: 'dar_es_salaam', name: 'Dar es Salaam', x: 900, y: 1060, resources: ['wine', 'timber'] },
    { id: 'mozambique', name: 'Mozambique', x: 830, y: 1250, resources: ['timber', 'grain'] },
    { id: 'durban', name: 'Durban', x: 680, y: 1550, resources: ['wine', 'grain'] },
    { id: 'cape_town', name: 'Cape Town', x: 450, y: 1700, resources: ['wine', 'timber'] },
];

export const resourcePrices = {
    grain: { baseBuy: 10, baseSell: 15, name: 'Grain' },
    spice: { baseBuy: 50, baseSell: 80, name: 'Spice' },
    wine: { baseBuy: 20, baseSell: 35, name: 'Wine' },
    timber: { baseBuy: 15, baseSell: 25, name: 'Timber' },
    ivory: { baseBuy: 100, baseSell: 160, name: 'Ivory' },
};
