const WIDTH = 960;
const HEIGHT = 540;
const TILE = 24;

const palette = {
  ink: 0x263238, grass: 0x83c49f, grassLight: 0x9bd1a9, grassDark: 0x65aa88,
  cream: 0xfff9e8, coral: 0xef715e, sun: 0xf5c451, sky: 0xb9e2e5,
  brown: 0x9d684e, brownLight: 0xc38a61, blue: 0x70a9bd, lavender: 0x9c91c2,
};

let game;
const ui = {
  objective: document.getElementById('objective-text'),
  status: document.getElementById('status-text'),
  clues: document.getElementById('clue-count'),
  tip: document.getElementById('hud-tip'),
};

class ParkScene extends Phaser.Scene {
  constructor() { super('ParkScene'); }

  create() {
    this.cameras.main.setBackgroundColor(palette.sky);
    this.drawPark();
    this.interactables = [];
    this.clues = 0;
    this.talking = false;
    this.createDog(485, 325, 0.72, palette.blue, 'MILO', 'A golden blur ran toward the pond!');
    this.createDog(690, 200, 0.78, palette.lavender, 'DOT', 'I saw her by the red ball near the big tree.');
    this.createDog(255, 185, 0.75, palette.brown, 'BEANS', 'Your mom waited at the park gate. Follow the path!');
    this.player = this.createDog(150, 410, 0.8, palette.coral, 'YOU', null, true);
    this.mom = this.createDog(790, 410, 1.2, palette.coral, 'MOM', null);
    this.mom.setVisible(false);
    this.physics.add.existing(this.player);
    this.player.body.setSize(27, 34).setOffset(-13, -17);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,SPACE');
    this.dialogue = this.add.container(WIDTH / 2, HEIGHT - 78).setDepth(20).setVisible(false);
    this.createDialogue();
    this.input.keyboard.on('keydown-E', () => this.tryInteract());
    this.input.keyboard.on('keydown-SPACE', () => this.tryInteract());
    ui.status.textContent = 'Three friendly dogs may know the way.';
  }

  update() {
    if (!this.player.active || this.talking) return;
    const speed = 155;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    this.player.body.setVelocity((right - left) * speed, (down - up) * speed);
    if (left || right || up || down) this.player.flipX = left;
    this.player.x = Phaser.Math.Clamp(this.player.x, 42, WIDTH - 42);
    this.player.y = Phaser.Math.Clamp(this.player.y, 116, HEIGHT - 36);
    const nearby = this.findNearby();
    ui.tip.textContent = nearby ? `Press E to talk to ${nearby.name}` : 'Explore the park and ask the dogs for clues.';
    ui.tip.style.color = nearby ? '#ef715e' : '#263238';
  }

  drawPark() {
    const g = this.add.graphics();
    g.fillStyle(palette.grass); g.fillRect(0, 0, WIDTH, HEIGHT);
    for (let y = 96; y < HEIGHT; y += TILE) for (let x = 0; x < WIDTH; x += TILE) {
      if ((x / TILE + y / TILE) % 5 === 0) { g.fillStyle(palette.grassLight); g.fillRect(x + 5, y + 8, 3, 3); }
      if ((x / TILE * 3 + y / TILE) % 11 === 0) { g.fillStyle(palette.grassDark); g.fillRect(x + 15, y + 14, 2, 5); }
    }
    g.fillStyle(palette.cream); g.fillRect(0, 0, WIDTH, 94); g.fillStyle(palette.ink); g.fillRect(0, 92, WIDTH, 4);
    this.pixelText('PUPPY PARK', 28, 23, 18, palette.ink);
    this.pixelText('LOST + FOUND', 777, 28, 10, palette.coral);
    g.fillStyle(0xd5be83); g.fillRect(350, 96, 260, 444); g.fillStyle(0xe2cc91); g.fillRect(388, 96, 184, 444);
    g.fillStyle(0xf0dca3); g.fillRect(447, 96, 66, 444);
    this.drawPond(g, 115, 245); this.drawTree(g, 810, 160); this.drawTree(g, 88, 135);
    this.drawBench(g, 570, 405); this.drawBall(g, 625, 325, palette.coral); this.drawBall(g, 720, 382, palette.sun);
    this.drawGate(g, 780, 475); this.pixelText('GATE', 771, 507, 8, palette.ink);
    this.pixelText('POND', 90, 322, 8, palette.ink); this.pixelText('BIG TREE', 762, 252, 8, palette.ink);
  }

  drawPond(g, x, y) { g.fillStyle(palette.blue); g.fillEllipse(x + 80, y + 40, 175, 80); g.lineStyle(3, palette.ink); g.strokeEllipse(x + 80, y + 40, 175, 80); g.lineStyle(2, 0xa7d8db); g.lineBetween(x + 18, y + 30, x + 65, y + 30); g.lineBetween(x + 105, y + 48, x + 157, y + 48); }
  drawTree(g, x, y) { g.fillStyle(palette.brown); g.fillRect(x - 8, y + 35, 16, 72); g.fillStyle(palette.grassDark); g.fillRect(x - 38, y + 8, 76, 45); g.fillStyle(palette.grassLight); g.fillRect(x - 27, y - 8, 54, 55); g.fillStyle(palette.ink); g.fillRect(x - 27, y + 42, 14, 8); }
  drawBench(g, x, y) { g.fillStyle(palette.brown); g.fillRect(x, y, 86, 10); g.fillRect(x + 7, y + 22, 72, 8); g.fillRect(x + 12, y + 30, 7, 22); g.fillRect(x + 67, y + 30, 7, 22); }
  drawBall(g, x, y, color) { g.fillStyle(color); g.fillRect(x - 9, y - 9, 18, 18); g.fillStyle(palette.cream); g.fillRect(x - 3, y - 3, 6, 6); g.lineStyle(2, palette.ink); g.strokeRect(x - 9, y - 9, 18, 18); }
  drawGate(g, x, y) { g.lineStyle(4, palette.ink); g.strokeRect(x, y - 50, 85, 52); g.lineBetween(x + 28, y - 50, x + 28, y); g.lineBetween(x + 57, y - 50, x + 57, y); g.fillStyle(palette.coral); g.fillRect(x + 5, y - 43, 75, 5); }
  pixelText(text, x, y, size, color) { this.add.text(x, y, text, { fontFamily: 'Press Start 2P', fontSize: `${size}px`, color: `#${color.toString(16).padStart(6, '0')}` }).setResolution(2).setDepth(5); }

  createDog(x, y, scale, collar, name, clue, player = false) {
    const dog = this.add.container(x, y).setDepth(10).setScale(scale);
    const g = this.add.graphics();
    g.fillStyle(palette.ink); g.fillRect(-20, -24, 40, 44); g.fillRect(-27, -14, 8, 22); g.fillRect(19, -14, 8, 22);
    g.fillStyle(palette.cream); g.fillRect(-16, -18, 32, 30); g.fillRect(-11, 12, 8, 13); g.fillRect(3, 12, 8, 13);
    g.fillStyle(collar); g.fillRect(-17, 4, 34, 7); g.fillStyle(palette.ink); g.fillRect(-8, -5, 5, 5); g.fillRect(5, -5, 5, 5); g.fillRect(-3, 3, 7, 4);
    dog.add(g); if (!player) this.addLabel(dog, name, clue); dog.name = name; dog.clue = clue; dog.isPlayer = player;
    if (!player && clue) this.interactables.push(dog);
    return dog;
  }
  addLabel(dog, name, clue) { const label = this.add.text(0, -42, name, { fontFamily: 'Press Start 2P', fontSize: '9px', color: '#263238', backgroundColor: '#fff9e8', padding: { x: 5, y: 4 } }).setOrigin(.5).setResolution(2); dog.add(label); }
  findNearby() { return this.interactables.find(dog => dog.clue && Phaser.Math.Distance.Between(this.player.x, this.player.y, dog.x, dog.y) < 70); }
  tryInteract() {
    if (this.talking) { this.closeDialogue(); return; }
    if (this.clues === 3 && this.mom.visible && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mom.x, this.mom.y) < 80) { this.reunion(); return; }
    const dog = this.findNearby();
    if (dog) {
      this.showDialogue(dog.name, dog.clue);
      this.clues++;
      dog.clue = null;
      dog.list[1]?.setText('');
      ui.clues.textContent = `${this.clues} / 3 CLUES`;
      if (this.clues === 3) { ui.objective.textContent = 'Head to the gate'; ui.status.textContent = 'All clues found. Your mom is waiting at the gate!'; }
    }
  }
  createDialogue() { const box = this.add.graphics(); box.fillStyle(palette.cream); box.fillRect(-380, -36, 760, 72); box.lineStyle(3, palette.ink); box.strokeRect(-380, -36, 760, 72); const text = this.add.text(-350, -22, '', { fontFamily: 'Space Mono', fontSize: '15px', color: '#263238', fontStyle: 'bold', wordWrap: { width: 700 } }).setResolution(2); const prompt = this.add.text(350, 13, 'E / SPACE', { fontFamily: 'Press Start 2P', fontSize: '8px', color: '#ef715e' }).setOrigin(1); this.dialogue.add([box, text, prompt]); this.dialogueText = text; }
  showDialogue(name, line) { this.talking = true; this.dialogueText.setText(`${name}:  ${line || 'Woof!'}`); this.dialogue.setVisible(true); this.player.body.setVelocity(0, 0); }
  closeDialogue() { this.talking = false; this.dialogue.setVisible(false); if (this.clues === 3) this.mom.setVisible(true); }
  reunion() { this.talking = true; this.mom.setVisible(true); this.player.body.setVelocity(0, 0); this.showDialogue('MOM', 'There you are, little one! I knew you would find your way.'); ui.objective.textContent = 'Home together'; ui.status.textContent = 'Reunited! Press E to play again.'; ui.tip.textContent = 'The best adventures end together.'; this.dialogueText.setText('MOM:  There you are, little one! I knew you would find your way.'); this.input.keyboard.once('keydown-E', () => this.scene.restart()); }
}

game = new Phaser.Game({ type: Phaser.AUTO, width: WIDTH, height: HEIGHT, parent: 'game-container', pixelArt: true, physics: { default: 'arcade', arcade: { debug: false } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: ParkScene });