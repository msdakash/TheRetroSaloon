import { AfterViewInit, Component, NgZone, OnDestroy, computed, signal } from '@angular/core';

@Component({
  selector: 'app-saloon-home-page',
  imports: [],
  templateUrl: './saloon-home-page.html',
  styleUrl: './saloon-home-page.scss',
  standalone: true,
})
export class SaloonHomePage implements AfterViewInit, OnDestroy {
  private player?: YT.Player;
  private progressTimer?: ReturnType<typeof setInterval>;
  private clockTimer?: ReturnType<typeof setInterval>;
  private readonly playlistId = 'PLaiV2Tdk0-5k';

  private readonly backgroundPool = [
    '\streetViewArt.png',
    '\chaiKiTapri.png',
    '\chaiKiTapri2.png',
    'chaiKiTapri2.png',
  ];

  isReady = signal(false);
  isPlaying = signal(false);
  isMuted = signal(false);
  albumArt = signal(
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23d2a679" width="200" height="200"/%3E%3C/svg%3E',
  );
  isShuffled = signal(false);
  backgroundImage = signal('');
  onlineCount = signal(Math.floor(Math.random() * 100) + 1);

  title = signal('Retro Chai Ki Tapri');
  artist = signal('90s Bollywood');
  currentMusicTime = signal(0);
  totalTime = signal(0);
  now = new Date();
  hours = signal(0);
  minutes = signal('00');
  AmOrPm = signal('AM');

  progressPercent = computed(() => {
    const total = this.totalTime();
    if (!total) return 0;
    return Math.min(100, (this.currentMusicTime() / total) * 100);
  });

  constructor(private zone: NgZone) {
    this.backgroundImage.set(this.pickRandomBackground());
    this.startClock();
  }

  ngAfterViewInit(): void {
    this.loadYouTubeApi();
  }

  private pickRandomBackground(): string {
    const i = Math.floor(Math.random() * this.backgroundPool.length);
    return this.backgroundPool[i];
  }

  private loadYouTubeApi(): void {
    if (window.YT?.Player) {
      this.createPlayer();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      this.createPlayer();
    };
  }

  private createPlayer(): void {
    this.player = new YT.Player('youtube-player', {
      // Keep this compliant with YouTube's embed requirements.
      width: 480,
      height: 270,

      playerVars: {
        listType: 'playlist',
        list: this.playlistId,
        autoplay: 0,
        controls: 1,
        playsinline: 1,
        origin: window.location.origin,
        loop: 1,
      },

      events: {
        onReady: () => {
          this.zone.run(() => {
            this.isReady.set(true);
            this.updateSongInfo();
          });
        },

        onStateChange: (event: YT.OnStateChangeEvent) => {
          this.zone.run(() => {
            const playing = event.data === YT.PlayerState.PLAYING;
            this.isPlaying.set(playing);

            if (playing) {
              this.startProgressTracking();
            } else {
              this.stopProgressTracking();
            }

            if (event.data === YT.PlayerState.PLAYING || event.data === YT.PlayerState.CUED) {
              this.updateSongInfo();
            }

            if (event.data === YT.PlayerState.ENDED) {
              this.next();
            }
          });
        },
      },
    });
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  togglePlay(): void {
    if (!this.player) return;

    const state = this.player.getPlayerState();

    if (state === YT.PlayerState.PLAYING) {
      this.pause();
    } else {
      this.play();
    }
  }

  next(): void {
    this.player?.nextVideo();
    setTimeout(() => this.updateSongInfo(), 500);
  }

  previous(): void {
    this.player?.previousVideo();
    setTimeout(() => this.updateSongInfo(), 500);
  }

  shuffle(): void {
    this.player?.setShuffle(true);
  }

  unshuffle(): void {
    this.player?.setShuffle(false);
  }

  mute(): void {
    this.player?.mute();
    this.isMuted.set(true);
  }

  unmute(): void {
    this.player?.unMute();
    this.isMuted.set(false);
  }

  onProgressBarClick(event: MouseEvent): void {
    if (!this.player) return;

    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const seekTo = ratio * this.totalTime();

    this.player.seekTo(seekTo, true);
    this.currentMusicTime.set(seekTo);
  }

  formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressTimer = setInterval(() => {
      if (this.player) {
        this.currentMusicTime.set(this.player.getCurrentTime());
      }
    }, 500);
  }

  private stopProgressTracking(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
  }

  private updateSongInfo(): void {
    if (!this.player) return;

    const data = this.player.getVideoData();
    if (!data) return;

    this.title.set(data.title || 'Unknown Song');
    this.artist.set(data.author || 'Unknown Artist');

    this.currentMusicTime.set(this.player.getCurrentTime());
    this.totalTime.set(this.player.getDuration());

    const videoId = data.video_id;
    if (videoId) {
      this.albumArt.set(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    }
  }

  ngOnDestroy(): void {
    this.stopProgressTracking();
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
    this.player?.destroy();
  }

  changeBackground(): void {
    let next = this.pickRandomBackground();

    // avoid landing on the same image twice in a row
    while (next === this.backgroundImage() && this.backgroundPool.length > 1) {
      next = this.pickRandomBackground();
    }

    this.backgroundImage.set(next);
  }

  openLink(): void {
    window.open('https://github.com/msdakash', '_blank');
  }

  private updateClock(): void {
    const now = new Date();
    const h = now.getHours() % 12 || 12;
    this.hours.set(h);
    this.minutes.set(now.getMinutes().toString().padStart(2, '0'));
    this.AmOrPm.set(now.getHours() >= 12 ? 'PM' : 'AM');
  }
  private startClock(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 5000);
  }

  toggleShuffle(): void {
    const next = !this.isShuffled();
    this.isShuffled.set(next);

    if (next) {
      this.shuffle();
    } else {
      this.unshuffle();
    }
  }
}
