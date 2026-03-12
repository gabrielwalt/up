/**
 * Data Table block
 *
 * Converts the div-based block structure into a native HTML <table>.
 * The first row is treated as the header row (<thead> with <th> cells),
 * remaining rows become <tbody> with <td> cells.
 *
 * This block exists because the import pipeline (DOM → markdown → DA HTML)
 * converts all <table> elements to divs. This block restores the native
 * table structure at decoration time.
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const table = document.createElement('table');

  // First row → thead
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headerCells = [...rows[0].children];
  headerCells.forEach((cell) => {
    const th = document.createElement('th');
    th.innerHTML = cell.innerHTML;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Remaining rows → tbody
  if (rows.length > 1) {
    const tbody = document.createElement('tbody');
    rows.slice(1).forEach((row) => {
      const tr = document.createElement('tr');
      [...row.children].forEach((cell) => {
        const td = document.createElement('td');
        td.innerHTML = cell.innerHTML;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  block.innerHTML = '';
  block.appendChild(table);
}
