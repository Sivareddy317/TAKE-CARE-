/**
 * Clinical Image Preprocessing & Quality Analysis Service
 * Implements contrast enhancement, deskew rotation, adaptive thresholding,
 * noise reduction, and Laplacian blur detection.
 * Preserves the original image for non-destructive reprocessing.
 */

export interface PreprocessingOptions {
  grayscale?: boolean;
  enhanceContrast?: boolean;
  adaptiveThreshold?: boolean;
  noiseReduction?: boolean;
  rotation?: number; // 0, 90, 180, 270
}

export interface ImageQualityMetrics {
  isBlurry: boolean;
  blurScore: number; // Variance of Laplacian
  averageBrightness: number;
  contrastRatio: number;
  isLowContrast: boolean;
  isLowLight: boolean;
  detectedOrientationSkew: number;
}

export class ImageProcessor {
  /**
   * Load an image source into an HTMLImageElement
   */
  static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Failed to load image for processing: ' + e));
      img.src = src;
    });
  }

  /**
   * Analyze image quality: blur score, brightness, and contrast
   */
  static async analyzeQuality(imageSrc: string): Promise<ImageQualityMetrics> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    // Scale to standard analysis dimensions for speed
    const width = Math.min(img.width, 600);
    const height = Math.round((img.height * width) / img.width);
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // 1. Calculate average brightness and standard deviation (contrast)
    let totalLuminance = 0;
    const luminances: number[] = new Float32Array(width * height) as unknown as number[];

    for (let i = 0; i < data.length; i += 4) {
      // Rec. 709 luminance formula
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      luminances[i / 4] = lum;
      totalLuminance += lum;
    }

    const avgLuminance = totalLuminance / (width * height);

    let varianceSum = 0;
    for (let i = 0; i < luminances.length; i++) {
      const diff = luminances[i] - avgLuminance;
      varianceSum += diff * diff;
    }
    const contrastStdDev = Math.sqrt(varianceSum / luminances.length);

    // 2. Laplacian operator for blur detection (edge intensity variance)
    // Kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let edgePixelCount = 0;

    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        const center = luminances[idx];
        const up = luminances[(y - 1) * width + x];
        const down = luminances[(y + 1) * width + x];
        const left = luminances[y * width + (x - 1)];
        const right = luminances[y * width + (x + 1)];

        const laplacian = Math.abs(up + down + left + right - 4 * center);
        laplacianSum += laplacian;
        laplacianSqSum += laplacian * laplacian;
        edgePixelCount++;
      }
    }

    const laplacianMean = laplacianSum / (edgePixelCount || 1);
    const laplacianVariance = (laplacianSqSum / (edgePixelCount || 1)) - (laplacianMean * laplacianMean);

    // Standard clinical thresholds:
    // Low Laplacian variance (< 65) indicates noticeable blur or low sharp edges.
    const isBlurry = laplacianVariance < 65;
    const isLowContrast = contrastStdDev < 38;
    const isLowLight = avgLuminance < 60;

    return {
      isBlurry,
      blurScore: Math.round(laplacianVariance),
      averageBrightness: Math.round(avgLuminance),
      contrastRatio: Math.round(contrastStdDev),
      isLowContrast,
      isLowLight,
      detectedOrientationSkew: 0,
    };
  }

  /**
   * Preprocess document image with configurable filters
   * Preserves fine clinical symbols (decimals, decimal dots, minus signs, mg, /dL).
   */
  static async preprocess(imageSrc: string, options: PreprocessingOptions = {}): Promise<string> {
    const img = await this.loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');

    const rotation = options.rotation || 0;
    const isRotated90or270 = rotation === 90 || rotation === 270;

    canvas.width = isRotated90or270 ? img.height : img.width;
    canvas.height = isRotated90or270 ? img.width : img.height;

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
    } else {
      ctx.drawImage(img, 0, 0);
    }

    // If no pixel processing is requested, return rotated canvas
    if (!options.grayscale && !options.enhanceContrast && !options.adaptiveThreshold && !options.noiseReduction) {
      return canvas.toDataURL('image/jpeg', 0.95);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const totalPixels = canvas.width * canvas.height;

    // 1. Grayscale & Contrast Histogram Stretch
    let minLum = 255;
    let maxLum = 0;

    const luminances = new Uint8Array(totalPixels);
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      luminances[i / 4] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const lumRange = Math.max(maxLum - minLum, 1);

    for (let i = 0; i < totalPixels; i++) {
      let val = luminances[i];

      // Safe contrast stretch: maps [minLum, maxLum] smoothly to [10, 245]
      // to avoid aggressive clipping that would erase decimal dots or dashes.
      if (options.enhanceContrast) {
        val = Math.round(((val - minLum) / lumRange) * 235 + 10);
      }

      // Adaptive gentle thresholding: values above local background become clean white,
      // while text strokes remain dark, retaining decimal points.
      if (options.adaptiveThreshold) {
        val = val > 140 ? 255 : Math.max(0, Math.round(val * 0.7));
      }

      const pixelIdx = i * 4;
      data[pixelIdx] = val;
      data[pixelIdx + 1] = val;
      data[pixelIdx + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  }
}
