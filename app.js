function getTemplate(type) {
  const templates = {
    empathy: ["悩み", "あるある", "共感", "救い"],
    problem: ["問題", "悪化", "解決", "結果"],
    gag: ["フリ", "違和感", "ズレ", "オチ"]
  };
  return templates[type];
}

function build() {
  const lines = document.getElementById("input").value.split("\n");
  const template = document.getElementById("template").value;

  const json = {
    title: document.getElementById("title").value,
    panels: lines.map((l, i) => ({
      id: i + 1,
      role: getTemplate(template)[i] || "",
      scene: l
    }))
  };

  document.getElementById("json").value =
    JSON.stringify(json, null, 2);

  document.getElementById("prompt").value =
    compilePrompt(json);
}

function compilePrompt(data) {
  let prompt = `
Japanese manga, black and white, 4-panel layout.

IMPORTANT:
All panels must use the SAME character design.
No variation allowed.

Character A:
short black hair, sharp eyes, school uniform

Character B:
medium hair, coat, scarf

`;

  data.panels.forEach(p => {
    prompt += `Panel ${p.id} (${p.role}): ${p.scene}\n`;
  });

  prompt += `
clean composition, readable, strong contrast`;

  return prompt;
}
