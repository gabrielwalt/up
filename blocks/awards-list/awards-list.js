/**
 * Awards List Block
 * Year-tabbed list of award/recognition items.
 *
 * Content model (table rows, 2 columns):
 *   Col1: Year (e.g., "2026") — used for tab grouping
 *   Col2: <p>Eyebrow</p><h3>Title</h3><p>Date · Desc</p><p><a>Read More</a></p>
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const yearGroups = new Map();

  // Group items by year
  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const year = cols[0].textContent.trim();
    const content = cols[1];

    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year).push(content);
  });

  block.textContent = '';

  // Build tabs
  const tabBar = document.createElement('div');
  tabBar.className = 'awards-list-tabs';
  tabBar.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'awards-list-panels';

  let first = true;
  yearGroups.forEach((items, year) => {
    const tabId = `tab-${year}`;
    const panelId = `panel-${year}`;

    // Tab button
    const tab = document.createElement('button');
    tab.className = 'awards-list-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', first ? 'true' : 'false');
    tab.id = tabId;
    tab.textContent = year;
    if (first) tab.classList.add('active');
    tabBar.append(tab);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'awards-list-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.id = panelId;
    if (!first) panel.hidden = true;

    items.forEach((content) => {
      const item = document.createElement('div');
      item.className = 'awards-list-item';

      // Extract elements
      const children = [...content.children];
      children.forEach((el) => {
        if (el.tagName === 'P' && !el.querySelector('a') && !item.querySelector('.awards-list-eyebrow')) {
          // First plain p = eyebrow category
          const eyebrow = document.createElement('div');
          eyebrow.className = 'awards-list-eyebrow';
          const dash = document.createElement('span');
          dash.className = 'awards-list-dash';
          eyebrow.append(dash);
          const label = document.createElement('span');
          label.className = 'awards-list-category';
          label.textContent = el.textContent;
          eyebrow.append(label);
          item.append(eyebrow);
        } else if (el.tagName === 'H3') {
          el.className = 'awards-list-title';
          item.append(el);
        } else if (el.tagName === 'P' && !el.querySelector('a')) {
          // Date + description paragraph
          el.className = 'awards-list-meta';
          item.append(el);
        } else if (el.tagName === 'P' && el.querySelector('a')) {
          // Read More link
          const link = el.querySelector('a');
          link.className = 'awards-list-readmore';
          link.classList.remove('button', 'primary', 'secondary', 'accent');
          item.append(link);
        }
      });

      panel.append(item);
    });

    panels.append(panel);
    first = false;
  });

  block.append(tabBar, panels);

  // Tab switching logic
  tabBar.addEventListener('click', (e) => {
    const clickedTab = e.target.closest('.awards-list-tab');
    if (!clickedTab) return;

    // Deactivate all tabs
    tabBar.querySelectorAll('.awards-list-tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    // Hide all panels
    panels.querySelectorAll('.awards-list-panel').forEach((p) => {
      p.hidden = true;
    });

    // Activate clicked tab
    clickedTab.classList.add('active');
    clickedTab.setAttribute('aria-selected', 'true');

    // Show corresponding panel
    const panelToShow = document.getElementById(clickedTab.getAttribute('aria-controls'));
    if (panelToShow) panelToShow.hidden = false;
  });
}
