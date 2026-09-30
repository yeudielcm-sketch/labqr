// QR reading (SPEC §6): native BarcodeDetector when available (Chrome Android),
// otherwise the zxing-wasm polyfill, loaded only when needed. The .wasm ships with the app
// (not from a CDN) so scanning works offline.

let detectorPromise;

export async function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      if ('BarcodeDetector' in window) {
        const formats = await window.BarcodeDetector.getSupportedFormats().catch(() => []);
        if (formats.includes('qr_code')) return new window.BarcodeDetector({ formats: ['qr_code'] });
      }
      const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
        import('barcode-detector/ponyfill'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ]);
      prepareZXingModule({
        overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) },
      });
      return new BarcodeDetector({ formats: ['qr_code'] });
    })();
  }
  return detectorPromise;
}

export function cameraSupported() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

// Starts the rear camera on `video` and calls onCode(rawText) for each read.
// The same text is not reported again until `repeatMs` has passed.
// Returns stop(). Rejects with the getUserMedia error (NotAllowedError, NotFoundError…).
export async function startScanner(video, onCode, { repeatMs = 1500 } = {}) {
  const [stream, detector] = await Promise.all([
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }),
    getDetector(),
  ]);
  video.srcObject = stream;
  video.setAttribute('playsinline', '');
  video.muted = true;
  await video.play();

  let stopped = false;
  let last = { text: '', at: 0 };
  let busy = false;

  const tick = async () => {
    if (stopped) return;
    if (!busy && video.readyState >= 2) {
      busy = true;
      try {
        const codes = await detector.detect(video);
        const text = codes[0]?.rawValue;
        const now = Date.now();
        if (text && (text !== last.text || now - last.at > repeatMs)) {
          last = { text, at: now };
          onCode(text);
        }
      } catch {
        // A frame that fails to decode is normal; keep scanning.
      }
      busy = false;
    }
    setTimeout(tick, 120);
  };
  tick();

  return function stop() {
    stopped = true;
    for (const track of stream.getTracks()) track.stop();
    video.srcObject = null;
  };
}

// Short confirmation: vibration where supported (Android), nothing else to decorate.
export function confirmRead() {
  navigator.vibrate?.(60);
}
