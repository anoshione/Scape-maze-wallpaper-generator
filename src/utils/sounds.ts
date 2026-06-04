class SoundManager {
  public muted: boolean = true;
  play(name: 'swipe' | 'success' | 'failure') {
    // Sound removed per user request
  }
}

export const soundManager = new SoundManager();
