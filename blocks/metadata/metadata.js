/**
 * Metadata is consumed by the delivery layer and should not render in the page.
 * @param {HTMLElement} block metadata block
 */
export default function decorate(block) {
  block.remove();
}
