const rules = require('./rules.json');

export function validateAndFormatResponse(text: string): { final: string, route: boolean } {
  let route = false;
  let modified = text.trim();

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern, 'i');

    if (regex.test(modified)) {
      switch (rule.action) {
        case 'route':
          route = true;
          break;
        case 'append_support_link':
          modified += '\n\n📞 Kontakt: https://example.com/support';
          break;
      }
    }
  }

  return { final: modified, route };
}
