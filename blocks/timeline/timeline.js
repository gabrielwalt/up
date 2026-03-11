/**
 * Timeline Block
 * Vertical timeline with period navigation sidebar.
 * Events with year, heading, description, and optional images.
 *
 * Content model (table rows, 2 columns):
 *   Col1: Period label (e.g., "1907-1950") — used for grouping
 *   Col2: Event content:
 *     - Text event: <p>Year</p><h3>Heading</h3><p>Description</p>
 *     - Image: <picture>...</picture>
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const periods = new Map();

  // Group items by period
  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const period = cols[0].textContent.trim();
    const content = cols[1];

    if (!periods.has(period)) {
      periods.set(period, []);
    }
    periods.get(period).push(content);
  });

  block.textContent = '';

  // Build layout: sidebar (desktop) + content
  const container = document.createElement('div');
  container.className = 'timeline-container';

  // Content column
  const contentCol = document.createElement('div');
  contentCol.className = 'timeline-content';

  // Mobile dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'timeline-dropdown';
  const dropdownBtn = document.createElement('button');
  dropdownBtn.className = 'timeline-dropdown-btn';
  const firstPeriod = [...periods.keys()][0] || '';
  dropdownBtn.textContent = firstPeriod;
  dropdownBtn.setAttribute('aria-expanded', 'false');
  const dropdownMenu = document.createElement('ul');
  dropdownMenu.className = 'timeline-dropdown-menu';
  dropdownMenu.hidden = true;
  dropdown.append(dropdownBtn, dropdownMenu);

  // Sidebar navigation (desktop)
  const sidebar = document.createElement('nav');
  sidebar.className = 'timeline-sidebar';
  sidebar.setAttribute('aria-label', 'Timeline periods');
  const sidebarList = document.createElement('ul');
  sidebarList.className = 'timeline-nav';

  let firstSection = true;
  periods.forEach((items, period) => {
    const periodId = `period-${period.replace(/\s+/g, '-').toLowerCase()}`;

    // Sidebar link
    const sidebarLi = document.createElement('li');
    const sidebarLink = document.createElement('a');
    sidebarLink.href = `#${periodId}`;
    sidebarLink.textContent = period;
    if (firstSection) sidebarLink.classList.add('active');
    sidebarLi.append(sidebarLink);
    sidebarList.append(sidebarLi);

    // Mobile dropdown link
    const dropdownLi = document.createElement('li');
    const dropdownLink = document.createElement('a');
    dropdownLink.href = `#${periodId}`;
    dropdownLink.textContent = period;
    dropdownLi.append(dropdownLink);
    dropdownMenu.append(dropdownLi);

    // Period section
    const section = document.createElement('div');
    section.className = 'timeline-period';
    section.id = periodId;

    // Period label
    const label = document.createElement('div');
    label.className = 'timeline-period-label';
    const labelText = document.createElement('span');
    labelText.className = 'timeline-period-text';
    labelText.textContent = period;
    label.append(labelText);
    section.append(label);

    // Items
    items.forEach((content) => {
      const pic = content.querySelector('picture') || content.querySelector('img');
      if (pic && !content.querySelector('h3')) {
        // Image item
        const imgItem = document.createElement('div');
        imgItem.className = 'timeline-image';
        const img = pic.tagName === 'IMG' ? pic : pic.querySelector('img');
        if (img && img.loading === 'lazy') img.loading = 'eager';
        imgItem.append(pic);
        section.append(imgItem);
      } else {
        // Text event
        const eventItem = document.createElement('div');
        eventItem.className = 'timeline-event';

        // Year eyebrow
        const firstP = content.querySelector('p');
        if (firstP && !firstP.querySelector('a')) {
          const eyebrow = document.createElement('div');
          eyebrow.className = 'timeline-eyebrow';
          const dash = document.createElement('span');
          dash.className = 'timeline-dash';
          eyebrow.append(dash);
          const yearText = document.createElement('span');
          yearText.className = 'timeline-year';
          yearText.textContent = firstP.textContent;
          eyebrow.append(yearText);
          eventItem.append(eyebrow);
        }

        // Heading
        const h3 = content.querySelector('h3');
        if (h3) {
          h3.className = 'timeline-heading';
          eventItem.append(h3);
        }

        // Description (remaining paragraphs)
        content.querySelectorAll('p').forEach((p) => {
          if (p !== firstP && p.textContent.trim()) {
            p.className = 'timeline-description';
            eventItem.append(p);
          }
        });

        section.append(eventItem);
      }
    });

    contentCol.append(section);
    firstSection = false;
  });

  sidebar.append(sidebarList);
  container.append(contentCol, sidebar);
  block.append(dropdown, container);

  // Mobile dropdown toggle
  dropdownBtn.addEventListener('click', () => {
    const expanded = dropdownBtn.getAttribute('aria-expanded') === 'true';
    dropdownBtn.setAttribute('aria-expanded', !expanded);
    dropdownMenu.hidden = expanded;
  });

  // Dropdown link click
  dropdownMenu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    dropdownBtn.textContent = link.textContent;
    dropdownBtn.setAttribute('aria-expanded', 'false');
    dropdownMenu.hidden = true;
  });

  // Scroll spy for sidebar active state
  const periodSections = contentCol.querySelectorAll('.timeline-period');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const { id } = entry.target;
        sidebarList.querySelectorAll('a').forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
        // Update mobile dropdown label
        const activeLink = sidebarList.querySelector('a.active');
        if (activeLink) dropdownBtn.textContent = activeLink.textContent;
      }
    });
  }, { threshold: 0.3 });

  periodSections.forEach((s) => observer.observe(s));
}
