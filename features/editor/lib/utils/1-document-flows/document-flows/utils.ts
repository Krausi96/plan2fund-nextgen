/**
 * ============================================================================  
 * EDITOR UTILITIES
 * ============================================================================  
 * @param element - The HTML element that was clicked
 * @returns true if the click should be ignored, false otherwise
 */
export function shouldIgnoreClick(element: HTMLElement): boolean {
  // Check if clicked element is an interactive tag
  const tagName = element.tagName.toLowerCase();
  const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
  if (interactiveTags.includes(tagName)) return true;
  
  // Check if element has data-badge attribute (origin badge)
  if (element.hasAttribute('data-badge') || element.closest('[data-badge="true"]')) {
    return true;
  }
  
  // Check if element is inside an interactive element
  const interactiveParent = element.closest('button, input, select, textarea, a, [data-badge="true"]');
  if (interactiveParent) return true;
  
  return false;
}