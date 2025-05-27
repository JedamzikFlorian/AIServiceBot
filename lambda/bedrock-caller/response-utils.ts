export function validateAndFormatResponse(text: string): { final: string, route: boolean } {
  let route = false;
  let modified = text.trim();

  // Beispielregel 1: Keine Antwort → Routing
  if (/weiß ich nicht|kann ich nicht beantworten/i.test(modified)) {
    route = true;
    modified += '\n\n🧑‍💼 Unsere Experten werden sich persönlich bei Ihnen melden.';
  }

  // Beispielregel 2: Supportanfrage
  if (/telefonnummer|kontakt|support/i.test(modified)) {
    modified += '\n\n📞 Kontakt: https://example.com/support';
  }

  return { final: modified, route };
}
