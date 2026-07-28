#!/usr/bin/env python3
"""CSS-FX 原子效果搜索引擎"""
import json, os, sys, glob

BASE = os.path.dirname(os.path.abspath(__file__))
REGISTRY = os.path.join(BASE, '..', 'atoms')

def load_effects():
    effects = []
    for f in glob.glob(f"{REGISTRY}/**/*.json", recursive=True):
        try:
            with open(f) as fp:
                effects.append(json.load(fp))
        except: pass
    return effects

def search(query, effects):
    query = query.lower()
    results = []
    for e in effects:
        score = 0
        if query in e.get('name','').lower(): score += 10
        if query in e.get('description','').lower(): score += 5
        for tag in e.get('tags',[]):
            if query in tag.lower(): score += 3
        for kw in e.get('keywords',[]):
            if query in kw.lower(): score += 3
        if score > 0: results.append((score, e))
    results.sort(key=lambda x: -x[0])
    return [r[1] for r in results[:20]]

def main():
    effects = load_effects()
    
    if len(sys.argv) < 2:
        print(f"CSS-FX 原子素材库 · {len(effects)} 个效果\n用法: fx search <关键词> | fx list | fx add <name>")
        return
    
    cmd = sys.argv[1]
    if cmd == 'list':
        for e in sorted(effects, key=lambda x: x.get('category','') + x.get('name','')):
            print(f"  [{e.get('category','?')}] {e.get('name','')} — {e.get('description','')[:60]}")
    elif cmd == 'search' and len(sys.argv) > 2:
        q = ' '.join(sys.argv[2:])
        results = search(q, effects)
        print(f"搜索 \"{q}\" → {len(results)} 结果:")
        for i, e in enumerate(results[:10], 1):
            print(f"  {i}. [{e.get('category','?')}] {e.get('name','')}")
            print(f"     {e.get('description','')[:80]}")
            print(f"     data-fx=\"{e.get('id','')}\"")
    elif cmd == 'add' and len(sys.argv) > 2:
        name = sys.argv[2]
        print(f"创建新效果: {name}")
        template = {
            "id": name.lower().replace(' ','-'),
            "name": name,
            "version": "1.0.0",
            "category": "background",
            "description": "",
            "tags": [],
            "keywords": [],
            "css": "/* CSS */\n",
            "html": "<!-- HTML -->\n",
            "js": "// JS\n",
            "dependencies": [],
            "browserSupport": "Chrome 90+, Firefox 90+, Safari 15+",
            "source": "handcrafted"
        }
        path = f"{REGISTRY}/{template['category']}/{template['id']}.json"
        with open(path, 'w') as f:
            json.dump(template, f, indent=2, ensure_ascii=False)
        print(f"  ✅ 已创建 {path}")

if __name__ == '__main__':
    main()
