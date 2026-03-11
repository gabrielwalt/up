/**
 * Form Block
 * Renders a styled form from structured content.
 *
 * Content model (table rows, 2 columns):
 *   Col1: Field label text
 *   Col2: Field type and options:
 *     - "text" — text input
 *     - "email" — email input
 *     - "textarea" — multi-line text
 *     - "select: Option1, Option2, ..." — dropdown
 *     - "submit" — submit button
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const form = document.createElement('form');
  form.className = 'form-fields';
  form.setAttribute('novalidate', '');

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const label = cols[0].textContent.trim();
    const typeStr = cols[1].textContent.trim();

    const group = document.createElement('div');
    group.className = 'form-field';

    if (typeStr === 'submit') {
      // Submit button
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'form-submit';
      btn.textContent = label;
      group.className = 'form-field form-field-submit';
      group.append(btn);
    } else if (typeStr === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      textarea.name = textarea.id;
      textarea.placeholder = label;
      textarea.rows = 4;

      const labelEl = document.createElement('label');
      labelEl.htmlFor = textarea.id;
      labelEl.textContent = label;
      labelEl.className = 'form-label';

      group.append(labelEl, textarea);
    } else if (typeStr.startsWith('select:')) {
      const options = typeStr.slice(7).split(',').map((o) => o.trim());
      const select = document.createElement('select');
      select.id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      select.name = select.id;

      // Placeholder option
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = label;
      placeholder.disabled = true;
      placeholder.selected = true;
      select.append(placeholder);

      options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.append(option);
      });

      const labelEl = document.createElement('label');
      labelEl.htmlFor = select.id;
      labelEl.textContent = label;
      labelEl.className = 'form-label';

      group.append(labelEl, select);
    } else {
      // text or email input
      const input = document.createElement('input');
      input.type = typeStr === 'email' ? 'email' : 'text';
      input.id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      input.name = input.id;
      input.placeholder = label;

      const labelEl = document.createElement('label');
      labelEl.htmlFor = input.id;
      labelEl.textContent = label;
      labelEl.className = 'form-label';

      group.append(labelEl, input);
    }

    form.append(group);
  });

  // Prevent actual submission (no backend)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  block.textContent = '';
  block.append(form);
}
