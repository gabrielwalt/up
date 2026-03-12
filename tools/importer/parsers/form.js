/* eslint-disable */
/* global WebImporter */

/**
 * Parser for form block
 *
 * Source: https://about.ups.com/us/en/thank-a-ups-hero.html
 *
 * Block Structure (2-column rows):
 *   Col1: Field label text
 *   Col2: Field type:
 *     - "text" — text input
 *     - "email" — email input
 *     - "textarea" — multi-line text
 *     - "select: Option1, Option2, ..." — dropdown
 *     - "submit" — submit button
 *
 * Source selector: .aemformcontainer
 *   form > .guideContainerNode
 *     .guideTextBox (text inputs)
 *     .guideDropDownList (select dropdowns)
 *     .guideTextArea (textarea)
 *     .guideCaptcha (reCAPTCHA - skipped)
 *     .guideContainerFormSubmitButton (submit button)
 */
export default function parse(element, { document }) {
  const cells = [];
  const processedLabels = new Set();

  // Find all form field nodes (AEM Adaptive Forms pattern)
  const fieldNodes = element.querySelectorAll(
    '.guideTextBox, .guideDropDownList, .guideTextArea, .guideEmailBox'
  );

  fieldNodes.forEach((node) => {
    // Extract label
    const labelEl = node.querySelector('label, .guideFieldLabel');
    let label = labelEl ? labelEl.textContent.trim() : '';
    // Remove asterisk markers
    label = label.replace(/\s*\*\s*$/, '').replace(/^\*\s*/, '').trim();

    if (!label || processedLabels.has(label)) return;
    processedLabels.add(label);

    // Detect field type
    let fieldType = 'text';

    if (node.classList.contains('guideTextArea') || node.querySelector('textarea')) {
      fieldType = 'textarea';
    } else if (node.classList.contains('guideDropDownList') || node.querySelector('select')) {
      const select = node.querySelector('select');
      if (select) {
        const options = [];
        select.querySelectorAll('option').forEach((opt) => {
          const val = opt.textContent.trim();
          // Skip placeholder/disabled options and empty values
          if (val && !opt.disabled && opt.value !== '' && val !== label) {
            options.push(val);
          }
        });
        if (options.length > 0) {
          fieldType = `select: ${options.join(', ')}`;
        }
      }
    } else if (node.classList.contains('guideEmailBox')
      || node.querySelector('input[type="email"]')
      || label.toLowerCase().includes('email')) {
      fieldType = 'email';
    }

    cells.push([[label], [fieldType]]);
  });

  // Find submit button
  const submitBtn = element.querySelector(
    '.guideContainerFormSubmitButton button, button[type="submit"], .submit'
  );
  if (submitBtn) {
    const label = submitBtn.textContent.trim() || 'Submit';
    cells.push([[label], ['submit']]);
  }

  if (cells.length > 0) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'Form', cells });
    element.replaceWith(block);
  }
}
