import json, sys, os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
try:
    with open(path, encoding='utf-8') as f:
        cfg = json.load(f)
except Exception:
    cfg = {}

cfg['loja_id']     = sys.argv[1]
cfg['loja_nome']   = sys.argv[2]
cfg['ip_servidor'] = sys.argv[3]
cfg.setdefault('supabase_url', 'https://xgvvqouygmofoirazoln.supabase.co')
cfg.setdefault('supabase_key', 'sb_publishable_prBUgFctQxjnMoHGZbwjMA_Bzeuie3L')
cfg.setdefault('porta_com',    'AUTO')
cfg.setdefault('admin_pin',    '1234')

with open(path, 'w', encoding='utf-8') as f:
    json.dump(cfg, f, ensure_ascii=False, indent=2)
