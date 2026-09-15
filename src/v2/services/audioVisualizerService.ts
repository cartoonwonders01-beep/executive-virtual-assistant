export interface VisualizerConfig {
  bandsCount: number;
  minDecibels?: number;
  maxDecibels?: number;
  smoothingTimeConstant?: number;
}

export class AudioVisualizerService {
  private config: VisualizerConfig = {
    bandsCount: 16,
    minDecibels: -90,
    maxDecibels: -10,
    smoothingTimeConstant: 0.8
  };

  public getConfig(): VisualizerConfig {
    return { ...this.config };
  }

  public updateConfig(patch: Partial<VisualizerConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  /**
   * Aggregates raw FFT frequency byte data (0-255) into normalized bands (0.0 - 1.0).
   */
  public computeFrequencyBands(freqData: Uint8Array, bandsCount: number = this.config.bandsCount): number[] {
    if (!freqData || freqData.length === 0) {
      return new Array(bandsCount).fill(0);
    }

    const bands: number[] = new Array(bandsCount).fill(0);
    const binSize = Math.floor(freqData.length / bandsCount);

    for (let i = 0; i < bandsCount; i++) {
      let sum = 0;
      const start = i * binSize;
      const end = Math.min(start + binSize, freqData.length);
      const count = Math.max(1, end - start);

      for (let j = start; j < end; j++) {
        sum += freqData[j];
      }

      // Normalize average (0-255) to 0.0 - 1.0
      bands[i] = Number((sum / count / 255).toFixed(3));
    }

    return bands;
  }

  /**
   * Generates synthetic frequency bands for UI visualizer preview when mic stream is simulated.
   */
  public simulateFrequencyBands(energy: number, bandsCount: number = this.config.bandsCount): number[] {
    const clamped = Math.max(0, Math.min(1, energy));
    const bands: number[] = [];

    for (let i = 0; i < bandsCount; i++) {
      // Create a natural bell-curve / vocal formant curve
      const centerFactor = 1 - Math.abs(i - bandsCount / 2) / (bandsCount / 2);
      const jitter = (Math.sin(i * 2.1 + Date.now() / 200) + 1) * 0.15;
      const val = Math.max(0.08, Math.min(1.0, clamped * centerFactor + jitter));
      bands.push(Number(val.toFixed(3)));
    }

    return bands;
  }

  /**
   * Renders the frequency bands onto an HTML5 2D canvas context.
   */
  public drawWaveform(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bands: number[],
    barColor: string = '#60a5fa'
  ): void {
    ctx.clearRect(0, 0, width, height);

    if (!bands || bands.length === 0) return;

    const count = bands.length;
    const barSpacing = 2;
    const totalSpacing = barSpacing * (count - 1);
    const barWidth = Math.max(2, (width - totalSpacing) / count);
    const centerY = height / 2;

    for (let i = 0; i < count; i++) {
      const x = i * (barWidth + barSpacing);
      const barHeight = Math.max(3, bands[i] * height * 0.9);
      const y = centerY - barHeight / 2;

      ctx.fillStyle = barColor;
      ctx.beginPath();
      // Draw rounded pill bar
      const radius = Math.min(barWidth / 2, barHeight / 2);
      ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, radius) : ctx.rect(x, y, barWidth, barHeight);
      ctx.fill();
    }
  }
}

export const audioVisualizerService = new AudioVisualizerService();
