const catchForm = document.getElementById('catch-form');

catchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!catchForm.checkValidity()) {
    catchForm.classList.add('was-validated');
    return;
  }

  const data = await postForm(catchForm.action, new FormData(catchForm));
  if (data.error) {
    showToast(data.error);
    return;
  }
  location.reload();
});

async function deleteCatch(button) {
  if (!confirm('Удалить эту запись из дневника?')) return;

  const data = await postForm(button.dataset.url, new FormData());
  if (data.error) {
    showToast(data.error);
    return;
  }
  button.closest('.catch-item').remove();
}
