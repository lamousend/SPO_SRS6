const quiz = document.getElementById('quiz');
let answered = false;

function showScore() {
  document.getElementById('quiz-streak').textContent = localStorage.getItem('quizStreak') || 0;
  document.getElementById('quiz-best').textContent = localStorage.getItem('quizBest') || 0;
}

async function checkAnswer(button) {
  if (answered) return;
  answered = true;

  const formData = new FormData();
  formData.append('bias_id', button.dataset.option);
  const data = await postForm(quiz.dataset.url, formData);
  if (data.error) {
    answered = false;
    showToast(data.error);
    return;
  }

  const right = quiz.querySelector('[data-option="' + data.correct_id + '"]');
  right.classList.add('btn-success');
  if (!data.correct) button.classList.add('btn-danger');

  const result = document.getElementById('quiz-result');
  result.classList.remove('d-none');
  result.classList.add(data.correct ? 'alert-success' : 'alert-danger');
  document.getElementById('quiz-verdict').textContent = data.correct
    ? 'Верно!'
    : 'Не совсем. Правильный ответ: ' + data.correct_name;
  document.getElementById('quiz-explanation').textContent = data.explanation;
  document.getElementById('quiz-next').classList.remove('d-none');

  const streak = data.correct ? Number(localStorage.getItem('quizStreak') || 0) + 1 : 0;
  localStorage.setItem('quizStreak', streak);
  if (streak > Number(localStorage.getItem('quizBest') || 0)) {
    localStorage.setItem('quizBest', streak);
  }
  showScore();
}

showScore();
