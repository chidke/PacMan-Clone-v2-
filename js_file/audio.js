const sound = {
  coins: [
    new Howl({
      src: "./Pac_sounds/audio_coin.mp3",
      volume: 0.5,
    }),
    new Howl({
      src: "./Pac_sounds/audio_coin2.mp3",
      volume: 0.5,
    }),
  ],
  siren: new Howl({
    src: "./Pac_sounds/audio_siren.mp3",
    loop: true,
    volume: 0.5,
  }),
  cherry: new Howl({
    src: "./Pac_sounds/audio_cherry.wav",
    volume: 0.5,
  }),
  powerUp: new Howl({
    src: "./Pac_sounds/audio_powerup.wav",
    volume: 0.5,
  }),
  ghostScared: new Howl({
    src: "./Pac_sounds/audio_ghostScared.wav",
    loop: true,
    volume: 0.3,
  }),
  success: new Howl({
    src: "./Pac_sounds/audio_success.wav",
    volume: 0.5,
  }),
  die: new Howl({
    src: "./Pac_sounds/audio_die.wav",
    volume: 0.5,
  }),
  gameOver: new Howl({
    src: "./Pac_sounds/audio_gameOver.wav",
    volume: 0.5,
  }),
};
