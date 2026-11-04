# Submission video

The walkthrough records the public ClearCheckout app through direct Playwright interactions.
The narration uses the synthetic `espeak-ng` English voice. Captions reproduce that narration.
Accounts use synthetic `example.test` addresses. The uploaded command is synthetic speech.
Model waiting periods are removed between clearly cut sections. The footage is not a recreated interface.

Payments are simulated. No money moves and no merchant order is placed.
Muse Spark Contributor prompts and responses may be used for training.
SAM selects object regions in a Muse Image illustration. It does not verify product details or understand arbitrary checkout pages.
The submission makes no claim of universal store support or completed screen reader user testing.

## Reproduce the recording

Use Node dependencies from `npm ci`. Install Playwright Chromium if needed.
Install `ffmpeg`, `ffprobe`, `espeak-ng`, and Python 3.
The public app must already be running with Meta configured and a cached Muse Image scene.
The capture can make three uncached paid calls. Obtain authorization before running it.
The script waits between requests to respect the app throttle. It does not reset the budget ledger.

1. Set `DEMO_URL` to the public app URL.
2. Set `VOICE_FIXTURE` to a nonprivate mono PCM16 WAV containing "Go to cart" at 16 or 24 kHz.
3. Run `node scripts/video/record.mjs`.
4. Run `python3 scripts/video/assemble.py`.
5. Decode the output with `ffmpeg -v error -i artifacts/submission/clearcheckout-submission.mp4 -f null -`.

The final video is `artifacts/submission/clearcheckout-submission.mp4`.
The sidecar captions are `artifacts/submission/captions.srt`.
The timed narration is `artifacts/submission/transcript.txt`.
The source narration and chapter interactions live in `scripts/video/record.mjs`.
Generated media remain in the ignored `artifacts` directory.

The recording intentionally stops if a model request fails. It does not substitute a fabricated success.
Before another recording, check the remaining app budget and request new authorization for additional uncached calls.

## Observed model limitation

The recorded Spark response displayed raw cent amounts as dollar values, including `4200 USD`.
The app's trusted total remained `$42.00 USD`.
The narration explicitly identifies this model error. The video retains the real response.
