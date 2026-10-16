import fs from 'fs';
import path from 'path';

async function auditRoutes() {
  const serverCode = fs.readFileSync('server.ts', 'utf-8');
  const routeRegex = /app\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^,]+)?/g;

  const routes: { method: string; path: string; handlerSnippet: string; needsAuth: boolean; unauthResponse: any; status: number }[] = [];
  let match;

  while ((match = routeRegex.exec(serverCode)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const middlewareOrHandler = match[3] || '';
    const needsAuth = middlewareOrHandler.includes('authenticateUser') && !middlewareOrHandler.includes('optionalAuthenticateUser');
    const optionalAuth = middlewareOrHandler.includes('optionalAuthenticateUser');

    routes.push({
      method,
      path: routePath,
      handlerSnippet: middlewareOrHandler.trim(),
      needsAuth,
      unauthResponse: null,
      status: 0,
    });
  }

  console.log(`Found ${routes.length} routes in server.ts. Testing unauthenticated calls against http://localhost:3000...`);

  const results = [];
  for (const r of routes) {
    let testPath = r.path;
    // Replace URL parameters with dummy test IDs
    testPath = testPath.replace(':id', 'dummy_id_123')
                       .replace(':docId', 'dummy_doc_123')
                       .replace(':entityId', 'dummy_ent_123')
                       .replace(':filename', 'test.jpg');

    let status = 0;
    let resBody = '';
    try {
      const url = `http://localhost:3000${testPath}`;
      const res = await fetch(url, {
        method: r.method,
        headers: { 'Content-Type': 'application/json' },
        body: ['POST', 'PUT', 'PATCH'].includes(r.method) ? JSON.stringify({}) : undefined,
      });
      status = res.status;
      const text = await res.text();
      try {
        resBody = JSON.stringify(JSON.parse(text));
      } catch {
        resBody = text.slice(0, 80);
      }
    } catch (err: any) {
      status = 0;
      resBody = `Network error: ${err.message}`;
    }

    results.push({
      method: r.method,
      route: r.path,
      testedUrl: testPath,
      authRequired: r.needsAuth ? 'REQUIRED (authenticateUser)' : r.handlerSnippet.includes('optionalAuthenticateUser') ? 'OPTIONAL (guest fallback)' : 'PUBLIC / NO AUTH',
      unauthHttpStatus: status,
      unauthResponsePreview: resBody.slice(0, 100),
    });
  }

  const rawOut = `=== SERVER ROUTES SECURITY & AUTH AUDIT ===\n` +
    `Total routes detected: ${results.length}\n\n` +
    results.map(r => `[${r.method.padEnd(6)}] ${r.route.padEnd(35)} | Auth: ${r.authRequired.padEnd(30)} | Unauth Status: ${r.unauthHttpStatus} | Response: ${r.unauthResponsePreview}`).join('\n');

  const outPath = path.join(process.cwd(), 'eval', 'raw', 'task4_routes.txt');
  fs.writeFileSync(outPath, rawOut, 'utf-8');
  console.log(`Wrote route audit to ${outPath}`);
}

auditRoutes().catch(console.error);
