import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import {
  env,
  pipeline,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.3.0';
import { WaveFile } from 'https://esm.sh/wavefile@11.0.0';

// Ensure we do not use browser cache
env.useBrowserCache = false;
env.allowLocalModels = false;

type ProgressCallbackValueBase = {
  status: 'initiate' | 'progress' | 'done';
  file: string;
};

type ProgressCallbackValueReady = {
  status: 'ready';
};

type ProgressCallbackValue =
  | ProgressCallbackValueBase
  | ProgressCallbackValueReady;

performance.mark('pipeline-start');

const transcriber = await pipeline(
  'automatic-speech-recognition',
  'Xenova/whisper-tiny.en',
  {
    progress_callback: (value: ProgressCallbackValue) => {
      if (
        value.status === 'ready' ||
        (value.file.endsWith('.onnx') && value.status !== 'progress')
      ) {
        performance.mark(`pipeline-${value.status}`);
      }
    },
  }
);
performance.mark('pipeline-end');

const pipelineConstructionDuration = performance.measure(
  'pipeline-duration',
  'pipeline-start',
  'pipeline-end'
);

const pipelineModelFetchDuration = performance.measure(
  'pipeline-model-fetch-duration',
  'pipeline-initiate',
  'pipeline-done'
);

const pipelineReadyDuration = performance.measure(
  'pipeline-ready-duration',
  'pipeline-done',
  'pipeline-ready'
);

console.log('Pipeline model fetch:', pipelineModelFetchDuration);
console.log('Pipeline ready:', pipelineReadyDuration);
console.log('Pipeline total:', pipelineConstructionDuration);

serve(async (req) => {
  const formData = await req.formData();
  const audioFile = formData.get('audio');

  if (!audioFile || typeof audioFile === 'string') {
    // TODO: return error
    return new Response(null, { status: 400 });
  }

  const audioBuffer = await audioFile.arrayBuffer();

  const wav = new WaveFile(new Uint8Array(audioBuffer));

  // TODO: this is slow - can we find a way to speed up?
  wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
  wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000

  let audioData = wav.getSamples(
    false,
    Float32Array
  ) as unknown as Float32Array;

  if (Array.isArray(audioData)) {
    // For this demo, if there are multiple channels for the audio file, we just select the first one.
    // In practice, you'd probably want to convert all channels to a single channel (e.g., stereo -> mono).
    audioData = audioData[0];
  }

  performance.mark('inference-start');

  const output = await transcriber(audioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  performance.mark('inference-end');

  const inferenceDuration = performance.measure(
    'inference-duration',
    'inference-start',
    'inference-end'
  );

  console.log('Inference:', inferenceDuration);

  return new Response(JSON.stringify(output), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// To invoke:
// curl -i --location --request POST 'http://localhost:9000/transcribe' \
//   -F audio=@"my-file.wav"
