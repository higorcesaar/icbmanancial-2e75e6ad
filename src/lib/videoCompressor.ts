import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

const CORE_VERSION = '0.12.6';
const BASE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

export interface CompressOptions {
  onProgress?: (ratio: number) => void;
  onLog?: (msg: string) => void;
}

/**
 * Compress a video to MP4 720p with reduced bitrate using ffmpeg.wasm.
 * Returns a new File ready to upload.
 */
export async function compressVideo(file: File, opts: CompressOptions = {}): Promise<File> {
  const ffmpeg = await getFFmpeg();

  const progressHandler = ({ progress }: { progress: number }) => {
    if (opts.onProgress) opts.onProgress(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on('progress', progressHandler);

  const inputName = 'input';
  const outputName = 'output.mp4';

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Scale to 720p (preserve aspect, even dims), H.264 with CRF for size,
    // capped bitrate, AAC audio at 96k.
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', "scale='min(1280,iw)':'-2'",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '28',
      '-maxrate', '1500k',
      '-bufsize', '3000k',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data as Uint8Array], { type: 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';
    return new File([blob], `${baseName}.mp4`, { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}
  }
}
