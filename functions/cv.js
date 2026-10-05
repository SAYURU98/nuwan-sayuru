// Serves the latest CV: an admin upload in KV if there is one, otherwise the PDF shipped with the site.
export async function onRequestGet({ env, request }) {
  const { value, metadata } = await env.FILES.getWithMetadata('cv', { type: 'arrayBuffer' });
  if (!value) return Response.redirect(new URL('/files/Nuwan_Sayuru_CV.pdf', request.url).toString(), 302);
  return new Response(value, { headers: {
    'content-type': 'application/pdf',
    'content-disposition': 'inline; filename="Nuwan_Sayuru_CV.pdf"',
    'cache-control': 'public, max-age=300',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox",
  } });
}
