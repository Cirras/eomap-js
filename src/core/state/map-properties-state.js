export class MapPropertiesState {
  constructor(
    name,
    width,
    height,
    type,
    effect,
    minimap,
    scrolls,
    music,
    ambientSound,
    musicControl,
    respawnX,
    respawnY
  ) {
    this.name = name;
    this.width = width;
    this.height = height;
    this.type = type;
    this.effect = effect;
    this.minimap = minimap;
    this.scrolls = scrolls;
    this.music = music;
    this.ambientSound = ambientSound;
    this.musicControl = musicControl;
    this.respawnX = respawnX;
    this.respawnY = respawnY;
  }
}
