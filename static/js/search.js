const form = document.getElementById('search-form');
const grid = document.getElementById('bias-grid');
const resetButton = document.getElementById('reset-btn');
let timer;

async function runSearch() {
  const q = form.elements.q.value.trim();
  const group = form.elements.group.value;
  resetButton.classList.toggle('d-none', !q && !group);

  const html = await getHtml(form.dataset.url + '?' + new URLSearchParams({ q: q, group: group }));
  if (html === null) {
    showToast('Не удалось выполнить поиск');
    return;
  }
  grid.innerHTML = html;
  document.getElementById('found-count').textContent = grid.querySelectorAll('.bias-card').length;
}

form.elements.q.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(runSearch, 300);
});

form.elements.group.addEventListener('change', runSearch);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  runSearch();
});

resetButton.addEventListener('click', (event) => {
  event.preventDefault();
  form.elements.q.value = '';
  form.elements.group.value = '';
  runSearch();
});
