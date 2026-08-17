// Hostname -> human-readable property name, so outbound_click events read
// "AI in Asia" rather than "www.aiinasia.com" in the GA4 report. Covers the
// full ecosystem this page links to (regional network, consumer network,
// data utility layer, tools, and the author attribution), plus the sourcing
// links used on /data. Unlisted hostnames fall back to the bare hostname.
export const ECOSYSTEM_PROPERTIES: Record<string, string> = {
  'aiinasia.com': 'AI in Asia',
  'www.aiinasia.com': 'AI in Asia',
  'aiinarabia.com': 'AI in Arabia',
  'www.aiinarabia.com': 'AI in Arabia',
  'aiineurope.co': 'AI in Europe',
  'www.aiineurope.co': 'AI in Europe',
  'urbandogowner.com': 'Urban Dog Owner',
  'www.urbandogowner.com': 'Urban Dog Owner',
  'urbancatowner.com': 'UrbanCatOwner',
  'www.urbancatowner.com': 'UrbanCatOwner',
  'dog-friendly.sg': 'Dog-Friendly Singapore',
  'www.dog-friendly.sg': 'Dog-Friendly Singapore',
  'payline.sg': 'PayLine',
  'www.payline.sg': 'PayLine',
  'coewatch.sg': 'COEwatch',
  'www.coewatch.sg': 'COEwatch',
  'duedate.sg': 'DueDate',
  'www.duedate.sg': 'DueDate',
  'tradechecked.sg': 'TradeChecked',
  'www.tradechecked.sg': 'TradeChecked',
  'promptandgo.ai': 'PromptAndGo',
  'www.promptandgo.ai': 'PromptAndGo',
  'adrianwatkins.com': 'Adrian Watkins',
  'www.adrianwatkins.com': 'Adrian Watkins',
};

export function propertyNameFor(hostname: string): string {
  return ECOSYSTEM_PROPERTIES[hostname] || hostname;
}

// This site's own hostnames, skipped by outbound-click tracking.
export const OWN_HOSTNAMES = ['democratising.ai', 'www.democratising.ai'];
