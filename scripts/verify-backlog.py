"""Verifica integridad documental: python scripts/verify-backlog.py."""
from pathlib import Path
import csv, json, re
r = Path(__file__).resolve().parent.parent
S = json.loads((r / 'backlog/issues.json').read_text(encoding='utf-8'))
ids = {x['id'] for x in S}
assert len(S) == 38 and len(ids) == 38, 'Cantidad o IDs duplicados'
assert all(len(x['acceptance']) >= 3 for x in S)
assert {x['epic'] for x in S} == {f'E{i}' for i in range(7)}
assert {x['sprint'] for x in S} == {f'S{i}' for i in range(7)}
assert all(x['priority'] in ('P0','P1','P2') and x['points'] in (1,2,3,5,8,13) for x in S)
assert all((r / x['issue_file']).is_file() for x in S)
backlog = (r / 'docs/PRODUCT_BACKLOG.md').read_text(encoding='utf-8')
for x in S:
    assert x['id'] in backlog
    deps = set(re.findall(r'BF-\d{3}', x['depends']))
    assert deps <= ids and x['id'] not in deps
    content = (r / x['issue_file']).read_text(encoding='utf-8')
    assert x['goal'] in content and all(ac in content for ac in x['acceptance'])
with (r / 'backlog/PRODUCT_BACKLOG.csv').open(encoding='utf-8-sig', newline='') as f:
    assert len(list(csv.DictReader(f))) == len(S)
required = ['README.md','AGENTS.md','CLAUDE.md','docs/PRODUCT_BACKLOG.md','docs/SCRUM_FRAMEWORK.md','docs/DEFINITION_OF_DONE.md','docs/SPRINT_ROADMAP.md','docs/ARCHITECTURE.md','docs/DECISIONS.md','.github/ISSUE_TEMPLATE/user_story.yml','.github/PULL_REQUEST_TEMPLATE.md','.github/workflows/docs-validation.yml']
assert all((r / path).is_file() for path in required)
print(f'PASS: {len(S)} historias, {sum(x["points"] for x in S)} SP, {len(required)} documentos base')
