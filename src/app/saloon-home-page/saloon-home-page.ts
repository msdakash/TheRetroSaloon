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

  // YOUR PLAYLIST
  private readonly playlistId = 'PLaiV2Tdk0-5k';

  // Swap these for curated shots (barbershop, retro market, neon signage, etc.)
  // whenever you're ready — a random one is picked on every load.
  private readonly backgroundPool = [
    'https://picsum.photos/seed/saloon-red/1600/1000',
    'https://picsum.photos/seed/saloon-neon/1600/1000',
    'https://picsum.photos/seed/saloon-market/1600/1000',
    'https://picsum.photos/seed/saloon-retro/1600/1000',
    'https://picsum.photos/seed/saloon-street/1600/1000',
  ];

  isReady = signal(false);
  isPlaying = signal(false);
  isMuted = signal(false);
  albumArt = signal('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23d2a679" width="200" height="200"/%3E%3C/svg%3E');
  backgroundImage = signal('');
  onlineCount = signal(Math.floor(Math.random() * 100) + 1);

  title = signal('Deluxe Rewind');
  artist = signal('90s Bollywood');
  currentTime = signal(0);
  totalTime = signal(0);

  // Derived progress percentage (0–100), used for the fill bar width
  progressPercent = computed(() => {
    const total = this.totalTime();
    if (!total) return 0;
    return Math.min(100, (this.currentTime() / total) * 100);
  });

  constructor(private zone: NgZone) {
    this.backgroundImage.set(this.pickRandomBackground());
  }

  ngAfterViewInit(): void {
    this.loadYouTubeApi();
  }

  private pickRandomBackground(): string {
    const i = Math.floor(Math.random() * this.backgroundPool.length);
    return this.backgroundPool[i];
  }

  private loadYouTubeApi(): void {

    // API already loaded
    if (window.YT?.Player) {
      this.createPlayer();
      return;
    }

    // Avoid loading the script twice
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
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
        loop: 1
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

            if (
              event.data === YT.PlayerState.PLAYING ||
              event.data === YT.PlayerState.CUED
            ) {
              this.updateSongInfo();
            }
          });
        }
      }
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

  /** Click/tap anywhere on the progress bar to seek. */
  onProgressBarClick(event: MouseEvent): void {
    if (!this.player) return;

    const bar = event.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const seekTo = ratio * this.totalTime();

    this.player.seekTo(seekTo, true);
    this.currentTime.set(seekTo);
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
        this.currentTime.set(this.player.getCurrentTime());
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

    this.currentTime.set(this.player.getCurrentTime());
    this.totalTime.set(this.player.getDuration());

    const videoId = data.video_id;
    if (videoId) {
      this.albumArt.set(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
    }
  }

  ngOnDestroy(): void {
    this.stopProgressTracking();
    this.player?.destroy();
  }
}
