const manage = document.getElementById('manage');
const groupsUrl = manage.dataset.groupsUrl;
const biasesUrl = manage.dataset.biasesUrl;

const groupForm = document.getElementById('group-form');
const biasForm = document.getElementById('bias-form');
const groupModal = new tabler.Modal(document.getElementById('group-modal'));
const biasModal = new tabler.Modal(document.getElementById('bias-modal'));
const confirmModal = new tabler.Modal(document.getElementById('confirm-modal'));
const groupsBody = document.getElementById('groups-body');
const biasesBody = document.getElementById('biases-body');
const biasGroupSelect = document.getElementById('bias-group');
const filterForm = document.getElementById('bias-filters');
const filterGroupSelect = document.getElementById('filter-group');
let filterTimer;
let deleteUrl = '';
let deleteName = '';

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function messageRow(body, columns, text) {
  body.innerHTML = '<tr><td colspan="' + columns + '" class="text-secondary">' + text + '</td></tr>';
}

async function loadGroups() {
  let groups;
  try {
    groups = await api(groupsUrl);
  } catch (e) {
    messageRow(groupsBody, 3, e.message || 'Не удалось загрузить группы');
    return;
  }

  let html = '';
  for (const group of groups) {
    html += '<tr>' +
      '<td><span class="status-dot me-2 status-' + group.color + '"></span><span>' + esc(group.name) + '</span></td>' +
      '<td>' + group.order + '</td>' +
      '<td class="text-nowrap">' +
      '<button type="button" class="btn btn-icon btn-sm btn-ghost-secondary" title="Изменить" onclick="openGroupForm(' + group.id + ')"><i class="ti ti-pencil"></i></button>' +
      '<button type="button" class="btn btn-icon btn-sm btn-ghost-danger" title="Удалить" onclick="askDelete(this)" data-url="' + groupsUrl + group.id + '/" data-name="' + esc(group.name) + '"><i class="ti ti-trash"></i></button>' +
      '</td></tr>';
  }
  groupsBody.innerHTML = html;
  if (!groups.length) messageRow(groupsBody, 3, 'Групп пока нет');

  fillGroupSelect(biasGroupSelect, groups, 'Выберите группу');
  fillGroupSelect(filterGroupSelect, groups, 'Все группы');
}

function fillGroupSelect(select, groups, placeholder) {
  const selected = select.value;
  let html = '<option value="">' + placeholder + '</option>';
  for (const group of groups) {
    html += '<option value="' + group.id + '">' + esc(group.name) + '</option>';
  }
  select.innerHTML = html;
  select.value = selected;
}

function filterQuery() {
  const params = new URLSearchParams();
  for (const name of ['search', 'group', 'danger_level', 'ordering']) {
    const value = filterForm.elements[name].value.trim();
    if (value) params.set(name, value);
  }
  return params.toString();
}

async function loadBiases() {
  const query = filterQuery();
  let biases;
  try {
    biases = await api(query ? biasesUrl + '?' + query : biasesUrl);
  } catch (e) {
    messageRow(biasesBody, 4, e.message || 'Не удалось загрузить искажения');
    return;
  }

  let html = '';
  for (const bias of biases) {
    const link = '/biases/' + bias.id + '/';
    html += '<tr>' +
      '<td><a class="text-break" href="' + link + '">' + esc(bias.name) + '</a></td>' +
      '<td class="d-none d-md-table-cell text-secondary">' + esc(bias.group_name) + '</td>' +
      '<td>' + bias.danger_level + '</td>' +
      '<td class="text-nowrap">' +
      '<button type="button" class="btn btn-icon btn-sm btn-ghost-secondary" title="Изменить" onclick="openBiasForm(' + bias.id + ')"><i class="ti ti-pencil"></i></button>' +
      '<button type="button" class="btn btn-icon btn-sm btn-ghost-danger" title="Удалить" onclick="askDelete(this)" data-url="' + biasesUrl + bias.id + '/" data-name="' + esc(bias.name) + '"><i class="ti ti-trash"></i></button>' +
      '</td></tr>';
  }
  biasesBody.innerHTML = html;
  if (!biases.length) messageRow(biasesBody, 4, query ? 'Ничего не найдено' : 'Искажений пока нет');
}

async function reloadTables() {
  await loadGroups();
  await loadBiases();
}

async function openForm(form, modal, url, id, title) {
  form.querySelector('.modal-title').textContent = title;
  if (id) {
    try {
      const data = await api(url + id + '/');
      for (const field of form.elements) {
        if (field.name in data) field.value = data[field.name];
      }
    } catch (e) {
      showToast(e.message || 'Не удалось загрузить данные');
      return;
    }
    form.dataset.id = id;
  }
  modal.show();
}

function openGroupForm(id) {
  openForm(groupForm, groupModal, groupsUrl, id, id ? 'Изменить группу' : 'Новая группа');
}

function openBiasForm(id) {
  openForm(biasForm, biasModal, biasesUrl, id, id ? 'Изменить искажение' : 'Новое искажение');
}

function showFieldErrors(form, errors) {
  for (const name in errors) {
    const field = form.elements[name];
    if (!field) {
      showToast(String(errors[name]));
      continue;
    }
    const standard = field.parentElement.querySelector('.invalid-feedback');
    if (standard) standard.classList.add('d-none');

    const message = document.createElement('div');
    message.className = 'invalid-feedback server-error';
    message.textContent = errors[name];
    field.after(message);
    field.classList.add('is-invalid');
  }
}

function clearErrors(form) {
  form.querySelectorAll('.server-error').forEach((message) => message.remove());
  form.querySelectorAll('.invalid-feedback.d-none').forEach((standard) => standard.classList.remove('d-none'));
  form.querySelectorAll('.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
}

function resetForm(form) {
  form.reset();
  clearErrors(form);
  form.classList.remove('was-validated');
  delete form.dataset.id;
}

async function submitForm(event, form, modal, url) {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  clearErrors(form);
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form));
  try {
    if (id) {
      await api(url + id + '/', 'PATCH', data);
    } else {
      await api(url, 'POST', data);
    }
  } catch (e) {
    if (e.status === 400 && e.data) {
      showFieldErrors(form, e.data);
    } else {
      showToast(e.message || 'Не удалось сохранить');
    }
    return;
  }

  modal.hide();
  showToast(id ? 'Изменения сохранены' : 'Запись создана', 'success');
  await reloadTables();
}

function askDelete(button) {
  deleteUrl = button.dataset.url;
  deleteName = button.dataset.name;
  document.querySelector('#confirm-modal .modal-body').textContent =
    'Вы действительно хотите удалить «' + deleteName + '»?';
  confirmModal.show();
}

document.getElementById('confirm-yes').addEventListener('click', async () => {
  confirmModal.hide();
  try {
    await api(deleteUrl, 'DELETE');
  } catch (e) {
    showToast(e.message || (e.data && e.data.detail) || 'Не удалось удалить');
    if (e.status === 404) await reloadTables();
    return;
  }
  showToast('Удалено: «' + deleteName + '»', 'success');
  await reloadTables();
});

document.getElementById('group-add').addEventListener('click', () => openGroupForm());
document.getElementById('bias-add').addEventListener('click', () => openBiasForm());

groupForm.addEventListener('input', () => clearErrors(groupForm));
biasForm.addEventListener('input', () => clearErrors(biasForm));

filterForm.addEventListener('submit', (event) => event.preventDefault());
filterForm.elements.search.addEventListener('input', () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(loadBiases, 300);
});
filterForm.elements.group.addEventListener('change', loadBiases);
filterForm.elements.danger_level.addEventListener('change', loadBiases);
filterForm.elements.ordering.addEventListener('change', loadBiases);

groupForm.addEventListener('submit', (event) => submitForm(event, groupForm, groupModal, groupsUrl));
biasForm.addEventListener('submit', (event) => submitForm(event, biasForm, biasModal, biasesUrl));

document.getElementById('group-modal').addEventListener('hidden.bs.modal', () => resetForm(groupForm));
document.getElementById('bias-modal').addEventListener('hidden.bs.modal', () => resetForm(biasForm));

reloadTables();
