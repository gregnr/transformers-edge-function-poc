# Transformers.js + Supabase Edge Functions

This is a proof of concept testing Transformer.js with Supabase Edge Functions. Executes the [`edge-runtime`](https://github.com/supabase/edge-runtime) directly via Docker.

## Start edge runtime server

```shell
npm run start
```

> This runs a `docker compose` command under the hood, listens on port `9000`.

## Proof of concept: Generate Embeddings

We have a function named `generate-embeddings` that lives under `./supabase/functions/generate-embeddings`. It loads the `all-MiniLM-L6-v2` model from Hugging Face and generates a 384 dimension embedding vector based on the a JSON `input` string passed to the function (via `POST` request):

```json
{
  "input": "The cat chases the mouse"
}
```

You can test the function using cURL:

```shell
curl -i --location --request POST 'http://localhost:9000/generate-embeddings' \
  --header 'Content-Type: application/json' \
  --data '{"input":"The cat chases the mouse"}'
```

## Proof of concept: Audio Transcription

Transcribe audio from a WAV file using [Whisper](https://github.com/openai/whisper).

There is a function named `transcribe` that lives under `./supabase/functions/transcribe`. It loads the `whisper-tiny.en` model from Hugging Face and transcribes a WAV file passed to the function via multi-part form data in a `POST` request:

```shell
curl -i --location --request POST 'http://localhost:9000/transcribe' \
  -F audio=@"my-file.wav"
```

## Resource usage

You can monitor the container's resource usage statistics in realtime using `docker stats`:

```shell
docker stats edge-runtime
```
