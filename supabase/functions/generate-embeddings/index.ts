import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import {
  env,
  pipeline,
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.3.0';

// Ensure we do not use browser cache
env.useBrowserCache = false;
env.allowLocalModels = false;

performance.mark('pipeline-start');
const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
  quantized: true,
});
performance.mark('pipeline-end');

const pipelineConstructionDuration = performance.measure(
  'pipeline-duration',
  'pipeline-start',
  'pipeline-end'
);

console.log({ pipelineConstructionDuration });

serve(async (req) => {
  const { input } = await req.json();

  performance.mark('embedding-start');
  const output = await pipe(input, {
    pooling: 'mean',
    normalize: true,
  });
  performance.mark('embedding-end');

  const embeddingDuration = performance.measure(
    'embedding-duration',
    'embedding-start',
    'embedding-end'
  );

  console.log({ embeddingDuration });

  const embedding = Array.from(output.data);

  return new Response(JSON.stringify(embedding), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// To invoke:
// curl -i --location --request POST 'http://localhost:9000/generate-embeddings' \
//   --header 'Content-Type: application/json' \
//   --data '{"input":"That is a happy person"}'
