export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    const path = url.pathname;

    if (path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/)) {
      newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (path.endsWith('.html') || path === '/' || path === '') {
      newHeaders.set('Cache-Control', 'no-cache, must-revalidate');
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }
}
