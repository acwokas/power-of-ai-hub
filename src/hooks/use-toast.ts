type ToastVariant = 'default' | 'destructive';

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

function ensureContainer(): HTMLDivElement {
  let el = document.getElementById('toast-root') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-root';
    el.style.cssText =
      'position:fixed;bottom:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;';
    document.body.appendChild(el);
  }
  return el;
}

export function toast({ title, description, variant = 'default' }: ToastInput) {
  if (typeof window === 'undefined') return;
  const container = ensureContainer();
  const card = document.createElement('div');
  const isDestructive = variant === 'destructive';
  card.style.cssText = `pointer-events:auto;background:hsl(var(--card));color:hsl(var(--foreground));border:1px solid ${
    isDestructive ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--border))'
  };border-radius:0.25rem;padding:0.75rem 1rem;max-width:360px;font-size:0.875rem;line-height:1.4;box-shadow:0 4px 12px rgba(0,0,0,0.25);opacity:0;transform:translateY(0.5rem);transition:opacity 0.2s ease,transform 0.2s ease;`;
  if (title) {
    const t = document.createElement('div');
    t.textContent = title;
    t.style.cssText = `font-weight:600;${isDestructive ? 'color:hsl(var(--destructive));' : ''}`;
    card.appendChild(t);
  }
  if (description) {
    const d = document.createElement('div');
    d.textContent = description;
    d.style.cssText = 'color:hsl(var(--muted-foreground));margin-top:0.125rem;';
    card.appendChild(d);
  }
  container.appendChild(card);
  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(0.5rem)';
    setTimeout(() => card.remove(), 220);
  }, 4000);
}
