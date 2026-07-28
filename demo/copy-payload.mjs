export function embedRuntimeSelection(html, target) {
  const query = target.split("?")[1] || "";
  const params = new URLSearchParams(query);
  for (const key of ["mode", "preset"]) {
    const value = params.get(key);
    if (!value) continue;
    const declarations = [
      new RegExp(
        `const ${key} = new URLSearchParams\\(location\\.search\\)\\.get\\("${key}"\\) \\|\\| "[^"]+";`,
      ),
      new RegExp(
        `const ${key} = params\\.get\\("${key}"\\) \\|\\| "[^"]+";`,
      ),
    ];
    const declaration = declarations.find((candidate) => candidate.test(html));
    if (!declaration) {
      throw new Error(`互动运行器缺少 ${key} 声明`);
    }
    return html.replace(
      declaration,
      `const ${key} = ${JSON.stringify(value)};`,
    );
  }
  return html;
}

export function embedRunnerMode(html, target) {
  return embedRuntimeSelection(html, target);
}
