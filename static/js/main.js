document.getElementById('theme-toggle').onclick = function () {
  const root = document.documentElement;
  const theme = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-bs-theme', theme);
  localStorage.setItem('theme', theme);
};

function showToast(text, type) {
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-bg-' + (type || 'danger') + ' border-0';
  toast.innerHTML = '<div class="d-flex"><div class="toast-body"></div>' +
    '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button></div>';
  toast.querySelector('.toast-body').textContent = text;
  document.getElementById('toast-container').append(toast);
  new tabler.Toast(toast, { delay: 4000 }).show();
}

async function api(url, method = 'GET', data) {
  const options = {
    method: method,
    headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value },
  };
  if (data !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    throw { message: 'Нет связи с сервером' };
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    let message = '';
    if (response.status === 404) message = 'Запись не найдена';
    if (response.status >= 500) message = 'Ошибка на сервере';
    throw { status: response.status, data: body, message: message };
  }
  return body;
}

async function postForm(url, formData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value },
      body: formData,
    });
    return await response.json();
  } catch (e) {
    return { error: 'Не удалось связаться с сервером' };
  }
}

async function getHtml(url) {
  try {
    const response = await fetch(url);
    return response.ok ? await response.text() : null;
  } catch (e) {
    return null;
  }
}

function randomBias(button) {
  getHtml(button.dataset.url).then((html) => {
    if (html) {
      button.closest('.bias-of-day').outerHTML = html;
    } else {
      showToast('Не удалось загрузить искажение');
    }
  });
}
