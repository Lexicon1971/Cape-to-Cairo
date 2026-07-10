export default class Port {
    constructor(scene, data) {
        this.scene = scene;
        this.id = data.id;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.resources = data.resources;
        this.dockCapacity = 5;
        this.dockedShips = [];

        // Draw port
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x8b4513, 1);
        graphics.fillCircle(this.x, this.y, 25);
        graphics.lineStyle(2, 0xd2691e, 1);
        graphics.strokeCircle(this.x, this.y, 25);

        // Port label
        scene.add.text(this.x, this.y - 35, this.name, {
            fontSize: '12px',
            color: '#fff',
            align: 'center',
        });
    }

    dockShip(ship) {
        if (this.dockedShips.length < this.dockCapacity) {
            this.dockedShips.push(ship);
            return true;
        }
        return false;
    }

    undockShip(ship) {
        const index = this.dockedShips.indexOf(ship);
        if (index !== -1) {
            this.dockedShips.splice(index, 1);
            return true;
        }
        return false;
    }
}
