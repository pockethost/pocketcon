#!/usr/bin/env python3
"""A local stand-in for GitHub's App manifest flow, for testing /setup without github.com.

Serves the two GitHub endpoints /setup uses:
  POST /settings/apps/new?state=S (and /organizations/ORG/settings/apps/new): checks the manifest like GitHub
       does and shows a "Create GitHub App" button, which redirects to the manifest's redirect_url with
       ?code=C&state=S.
  POST /app-manifests/{code}/conversions: swaps a code (once) for a fake app's client_id and client_secret.

Run it, then start PocketOne in dev mode with:
  OAUTHSETUP_GITHUB_WEB=http://127.0.0.1:8139 OAUTHSETUP_GITHUB_API=http://127.0.0.1:8139
(the overrides only apply with --dev).
"""
import html, json, secrets, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlencode, urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8139
# GitHub's error for an unknown default_permissions key is "Default permission records resource is not included
# in the list" (it rejected `email_addresses`). This list is our best reading of GitHub's permission names, with
# `emails` for the user "Email addresses" permission as in Probot's manifest template; github.com is the authority.
PERMISSIONS = {
    'actions', 'administration', 'checks', 'contents', 'deployments', 'environments', 'issues', 'metadata',
    'packages', 'pages', 'pull_requests', 'repository_hooks', 'repository_projects', 'secret_scanning_alerts',
    'secrets', 'security_events', 'single_file', 'statuses', 'vulnerability_alerts', 'workflows', 'members',
    'organization_administration', 'organization_hooks', 'organization_plan', 'organization_projects',
    'organization_secrets', 'organization_self_hosted_runners', 'team_discussions',
    'emails', 'followers', 'git_ssh_keys', 'gpg_keys', 'profile', 'starring', 'blocking', 'keys',
}
codes = {}  # code -> app


def manifest_errors(m):
    errs = []
    if not isinstance(m, dict):
        return ['manifest is not a JSON object']
    if not m.get('url'):
        errs.append('url is required')
    hook = m.get('hook_attributes')
    if hook is not None and not hook.get('url'):
        errs.append('hook_attributes.url is required')
    if len(m.get('callback_urls') or []) > 10:
        errs.append('at most 10 callback_urls')
    for k, v in (m.get('default_permissions') or {}).items():
        if k not in PERMISSIONS:
            errs.append(f'Default permission records resource is not included in the list ({k})')
        elif v not in ('read', 'write'):
            errs.append(f'bad access level for {k}: {v}')
    return errs


class H(BaseHTTPRequestHandler):
    def send(self, status, body, ctype='text/html; charset=utf-8', headers=None):
        data = body.encode()
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return self.rfile.read(n).decode() if n else ''

    def do_POST(self):
        u = urlparse(self.path)
        q = parse_qs(u.query)
        parts = u.path.strip('/').split('/')
        if u.path == '/settings/apps/new' or (len(parts) == 5 and parts[0] == 'organizations' and parts[2:] == ['settings', 'apps', 'new']):
            form = parse_qs(self.body())
            try:
                m = json.loads(form.get('manifest', [''])[0])
            except ValueError:
                m = None
            errs = manifest_errors(m)
            if errs:
                items = ''.join(f'<li>{html.escape(e)}</li>' for e in errs)
                return self.send(422, f'<h1>Invalid GitHub App configuration</h1><ul id="errors">{items}</ul>')
            state = q.get('state', [''])[0]
            owner = parts[1] if parts[0] == 'organizations' else 'you'
            code = secrets.token_hex(10)
            slug = m.get('name', 'app').lower().replace(' ', '-')
            codes[code] = {'slug': slug, 'owner': owner, 'name': m.get('name'), 'manifest': m}
            target = m['redirect_url'] + '?' + urlencode({'code': code, 'state': state})
            perms = html.escape(json.dumps(m.get('default_permissions')))
            return self.send(200, f'''<h1>Create GitHub App for {html.escape(owner)}</h1>
<p id="name">{html.escape(str(m.get("name")))}</p><p id="perms">{perms}</p>
<p id="callbacks">{html.escape(json.dumps(m.get("callback_urls")))}</p>
<a id="create" href="{html.escape(target)}">Create GitHub App</a>''')
        if len(parts) == 3 and parts[0] == 'app-manifests' and parts[2] == 'conversions':
            app = codes.pop(parts[1], None)
            if not app:
                return self.send(404, json.dumps({'message': 'Not Found'}), 'application/json')
            return self.send(201, json.dumps({
                'id': 1, 'slug': app['slug'], 'name': app['name'],
                'client_id': 'Iv23mock' + secrets.token_hex(6), 'client_secret': secrets.token_hex(20),
                'webhook_secret': None, 'pem': '-----BEGIN RSA PRIVATE KEY-----\nmock\n-----END RSA PRIVATE KEY-----\n',
                'html_url': f'https://github.com/apps/{app["slug"]}', 'owner': {'login': app['owner']},
            }), 'application/json')
        self.send(404, 'not found', 'text/plain')

    def log_message(self, fmt, *args):
        sys.stderr.write('mock-github ' + fmt % args + '\n')


print(f'mock-github on http://127.0.0.1:{PORT}', flush=True)
ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
