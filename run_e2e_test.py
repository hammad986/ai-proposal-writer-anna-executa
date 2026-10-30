import urllib.request
import json
import datetime
import sys

BASE = 'http://localhost:5180'

def post_json(path, data):
    body = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(f'{BASE}{path}', data=body, headers={'content-type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print('=============================================')
print('RUNNING ANNA APP COMPLETE E2E TEST')
print('=============================================')

# 1. Create Session
print('\n--- Step 1: Create Session ---')
sess = post_json('/api/session/create', {})
session_id = sess.get('session_id')
print(f'Session created successfully! session_id={session_id}')

# 2. Tool call: ping
print('\n--- Step 2: Tools Invoke (ping) ---')
call_ping = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'ping',
        'args': {}
    }
}
resp_ping = post_json('/api/session/call', call_ping)
print('Ping response:', resp_ping)
res = resp_ping.get('result', {})
assert res.get('pong') is True or res.get('data', {}).get('pong') is True, f'Ping failed: {resp_ping}'
print('Ping test: PASSED')

# 3. Tool call: generate_proposal
print('\n--- Step 3: Tools Invoke (generate_proposal) ---')
sample_form = {
    'projectTitle': 'Production AI Proposal Platform',
    'projectType': 'Web App & Agent System',
    'industry': 'AI Technology',
    'clientName': 'Jane Doe',
    'clientCompany': 'Future Corp',
    'clientEmail': 'jane@futurecorp.com',
    'agencyName': 'Nexus Dynamics',
    'agencyTagline': 'Next-gen enterprise software',
    'problem': 'Manual proposal creation is slow, error-prone, and inconsistent across agency teams.',
    'features': ['Multi-step scoping wizard', 'Dynamic section generator', 'PDF export module'],
    'technicalRequirements': ['React 18', 'Python 3.12+', 'Anna Executa Plugin'],
    'targetUsers': 'Freelancers and digital agencies',
    'constraints': 'Strict deadline and SOC2 compliance',
    'budgetRange': '$15,000 - $25,000',
    'complexity': 'complex',
    'paymentMilestone': '40-30-30',
    'advancePercent': 40,
    'revisions': 3,
    'warrantyPeriod': '6 Months',
    'additionalServices': ['SEO Optimization', 'Cloud Hosting'],
    'tone': 'persuasive',
    'language': 'English',
    'includedSections': ['Executive Summary', 'Project Overview', 'Scope of Work', 'Technical Architecture', 'Timeline & Milestones', 'Investment & Pricing', 'Why Choose Us', 'Terms & Conditions'],
    'specialEmphasis': 'Highlight zero-dependency installation and cross-platform native binaries'
}
call_gen = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'generate_proposal',
        'args': {'formData': sample_form}
    }
}
resp_gen = post_json('/api/session/call', call_gen)
res_gen = resp_gen.get('result', {})
proposal = res_gen.get('proposal') or res_gen.get('data', {}).get('proposal', {})
print(f"Proposal Title: {proposal.get('title')}")
print(f"Proposal ID: {proposal.get('id')}")
gen_date = proposal.get('generatedDate')
val_date = proposal.get('validUntil')
print(f"Generated Date: {gen_date}")
print(f"Valid Until: {val_date}")
today_iso = datetime.date.today().isoformat()
expected_val = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
assert gen_date == today_iso, f"Expected generatedDate {today_iso}, got {gen_date}"
assert val_date == expected_val, f"Expected validUntil {expected_val}, got {val_date}"
sections = proposal.get('sections', [])
print(f"Total Sections Generated: {len(sections)}")
for s in sections:
    print(f"  - [{s.get('type')}] {s.get('title')}: {len(s.get('content', ''))} chars")
assert len(sections) >= 5, 'Expected at least 5 sections'

# 4. Tool call: regenerate_section
print('\n--- Step 4: Tools Invoke (regenerate_section) ---')
call_regen = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'regenerate_section',
        'args': {
            'formData': sample_form,
            'sectionTitle': 'Scope of Work',
            'instruction': 'Emphasize high-availability and security certifications.',
            'currentContent': sections[2].get('content', '') if len(sections) > 2 else ''
        }
    }
}
resp_regen = post_json('/api/session/call', call_regen)
res_regen = resp_regen.get('result', {})
new_sec = res_regen.get('section') or res_regen.get('data', {}).get('section', {})
print(f"Regenerated Section Title: {new_sec.get('title')}")
print(f"Regenerated Section Length: {len(new_sec.get('content', ''))} chars")
assert new_sec.get('title') == 'Scope of Work'

# 4b. Tool call: audit_proposal (v0.2.0)
print('\n--- Step 4b: Tools Invoke (audit_proposal v0.2.0) ---')
call_audit = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'audit_proposal',
        'args': {'proposal': proposal}
    }
}
resp_audit = post_json('/api/session/call', call_audit)
res_audit = resp_audit.get('result', {})
audit_data = res_audit.get('audit') or res_audit.get('data', {}).get('audit', {})
print(f"Quality Score: {audit_data.get('overallScore')}/100")
print(f"Audit Summary: {audit_data.get('summary')}")
assert audit_data.get('overallScore') is not None, 'Expected overallScore in audit'
print('audit_proposal test: PASSED')

# 4c. Tool call: refine_text (v0.2.0)
print('\n--- Step 4c: Tools Invoke (refine_text v0.2.0) ---')
call_refine = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'refine_text',
        'args': {
            'text': 'We build good software that works fast.',
            'instruction': 'improve_tone',
            'context': 'Production AI Proposal Platform'
        }
    }
}
resp_refine = post_json('/api/session/call', call_refine)
res_refine = resp_refine.get('result', {})
refined_text = res_refine.get('refinedText') or res_refine.get('data', {}).get('refinedText', '')
print(f"Refined Text: {refined_text}")
assert len(refined_text) > 0, 'Expected non-empty refined text'
print('refine_text test: PASSED')

# 4d. Tool call: extract_brief (v0.2.0)
print('\n--- Step 4d: Tools Invoke (extract_brief v0.2.0) ---')
brief_input = (
    "Hi, I am Sarah Jenkins from Acme Retail Ltd (sarah@acmeretail.com). "
    "We need an automated inventory forecasting dashboard to solve our stockouts. "
    "Key features needed: real-time alerts, ERP sync, and executive reporting. "
    "Our budget is around $25,000 and we want to launch in 8 weeks."
)
call_extract = {
    'session_id': session_id,
    'ns': 'tools',
    'method': 'invoke',
    'args': {
        'tool_id': 'tool-hammad-ai-proposal-writer-anna-84jkbu68',
        'method': 'extract_brief',
        'args': {'briefText': brief_input}
    }
}
resp_extract = post_json('/api/session/call', call_extract)
res_extract = resp_extract.get('result', {})
extracted = res_extract.get('extracted') or res_extract.get('data', {}).get('extracted', {})
print(f"Extracted Client: {extracted.get('clientName')} at {extracted.get('clientCompany')}")
print(f"Extracted Budget: {extracted.get('budgetRange')}")
assert 'Sarah Jenkins' in extracted.get('clientName', ''), 'Failed to extract client name'
print('extract_brief test: PASSED')

# 5. Host API: Storage
print('\n--- Step 5: Host API Storage (set/get) ---')
call_set = {
    'session_id': session_id,
    'ns': 'storage',
    'method': 'set',
    'args': {'key': 'proposals_cache', 'value': [proposal]}
}
resp_set = post_json('/api/session/call', call_set)
assert resp_set.get('ok') is True, f'storage.set failed: {resp_set}'
print('storage.set: OK')

call_get = {
    'session_id': session_id,
    'ns': 'storage',
    'method': 'get',
    'args': {'key': 'proposals_cache'}
}
resp_get = post_json('/api/session/call', call_get)
assert resp_get.get('ok') is True, f'storage.get failed: {resp_get}'
cached = resp_get.get('result', {}).get('value')
print(f'storage.get: OK (retrieved {len(cached)} proposal(s))')

# 6. Host API: Window
print('\n--- Step 6: Host API Window (set_title/ready) ---')
resp_title = post_json('/api/session/call', {'session_id': session_id, 'ns': 'window', 'method': 'set_title', 'args': {'title': 'AI Proposal Writer - Production'}})
assert resp_title.get('ok') is True
print('window.set_title: OK')

resp_ready = post_json('/api/session/call', {'session_id': session_id, 'ns': 'window', 'method': 'ready', 'args': {}})
assert resp_ready.get('ok') is True
print('window.ready: OK')

# 7. Verify Static Bundle
print('\n--- Step 7: Static Bundle Assets ---')
with urllib.request.urlopen(f'{BASE}/anna-apps/ai-proposal-writer-anna/dev/index.html') as resp:
    assert resp.status == 200
    print('GET index.html: 200 OK')
with urllib.request.urlopen(f'{BASE}/anna-apps/ai-proposal-writer-anna/dev/anna-tool-ids.js') as resp:
    assert resp.status == 200
    print('GET anna-tool-ids.js: 200 OK')
with urllib.request.urlopen(f'{BASE}/anna-apps/ai-proposal-writer-anna/dev/app.js') as resp:
    assert resp.status == 200
    print('GET app.js: 200 OK')

print('\n=============================================')
print('COMPLETE END-TO-END LOCAL TEST PASSED 100%!')
print('=============================================')
