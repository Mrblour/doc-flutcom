/**
 * Flutcom Copy to Clipboard Plugin
 * Automatically makes elements with data-copy attribute copy their value to clipboard
 */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  
  const textToCopy = btn.getAttribute('data-copy');
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Visual feedback: briefly change icon to a checkmark
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check-lg text-emerald-400"></i>';
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
});
