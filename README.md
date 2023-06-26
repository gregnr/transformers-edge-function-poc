# Transformers.js + Supabase Edge Functions

This is a proof of concept testing Transformer.js with Supabase Edge Functions. Executes the `edge-runtime` directly via Docker.

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
