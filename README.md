# Cape to Cairo

A browser-based trade game inspired by **Patrician III**, featuring a dynamic economy, multiple ports, and ship management.

## Features

- **Map-based gameplay**: Navigate your ships across a detailed game world
- **Trade economy**: Buy and sell goods at different ports with dynamic pricing
- **Ship management**: Control a fleet of merchant ships with cargo capacity
- **Port system**: 5 major trading ports with unique resource availability
- **Real-time graphics**: Built with Phaser 3 for smooth 2D gameplay

## Tech Stack

- **Phaser 3**: 2D game framework for browser
- **JavaScript (ES6+)**: Game logic and mechanics
- **Vite**: Fast build tool and dev server
- **HTML5 Canvas**: Rendering

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
git clone https://github.com/Lexicon1971/Cape-to-Cairo.git
cd Cape-to-Cairo
npm install
```

### Running Locally

```bash
npm run dev
```

The game will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## Game Mechanics

### Ships

- Drag ships to move them to new locations
- Each ship has a cargo capacity and gold pool
- Ships can dock at ports and trade goods

### Ports

- 5 major ports: Cairo, Cape Town, Alexandria, Zanzibar, Dar es Salaam
- Each port offers unique goods to trade
- Prices fluctuate based on supply and demand

### Trading

- Buy goods at ports where they're cheap
- Sell at ports where prices are high
- Manage cargo capacity to maximize profits

## Project Structure

```
src/
  config/          Game configuration and constants
  entities/        Ship, Port, and other game objects
  scenes/          Phaser scenes (game loop)
  systems/         Game state and economy management
  main.js          Entry point
```

## Roadmap

- [ ] Trading UI and cargo management
- [ ] Port interaction menus
- [ ] Dynamic price calculation
- [ ] Weather and hazards
- [ ] More detailed ship models
- [ ] Multiplayer support (future)
- [ ] Save/load game state

## License

MIT
