// Serves the latest uploaded photo from KV.
export async function onRequestGet({ env }) {
  const { value, metadata } = await env.FILES.getWithMetadata('photo', { type: 'arrayBuffer' });
  if (!value) return new Response('Not uploaded yet.', { status: 404 });
  return new Response(value, { headers: {
    'content-type': (metadata && metadata.type) || 'application/octet-stream',
    'cache-control': 'public, max-age=300',
    
  } });
}
