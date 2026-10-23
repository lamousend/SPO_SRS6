from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class BiasGroup(models.Model):
    COLOR_CHOICES = [
        ('teal', 'Бирюзовый'),
        ('orange', 'Оранжевый'),
        ('lime', 'Лаймовый'),
        ('purple', 'Фиолетовый'),
        ('blue', 'Синий'),
    ]

    name = models.CharField('Название', max_length=150)
    color = models.CharField('Цвет', max_length=150, choices=COLOR_CHOICES)
    description = models.TextField('Описание', blank=True)
    order = models.PositiveSmallIntegerField('Порядок', default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'группа искажений'
        verbose_name_plural = 'группы искажений'

    def __str__(self):
        return self.name


class Bias(models.Model):
    group = models.ForeignKey(BiasGroup, on_delete=models.PROTECT, related_name='biases')
    name = models.CharField('Название', max_length=150)
    short_description = models.CharField('Кратко', max_length=255)
    full_description = models.TextField('Подробное описание')
    example = models.TextField('Пример из жизни')
    how_to_fight = models.TextField('Как бороться')
    source = models.URLField('Источник', blank=True)
    danger_level = models.PositiveSmallIntegerField(
        'Опасность', default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='1 - почти не влияет на решения, 5 - очень влияет',
    )
    related = models.ManyToManyField('self', blank=True, verbose_name='Связанные искажения')

    class Meta:
        ordering = ['name']
        verbose_name = 'искажение'
        verbose_name_plural = 'искажения'

    def __str__(self):
        return self.name


class Catch(models.Model):
    bias = models.ForeignKey(Bias, on_delete=models.CASCADE, related_name='catches')
    situation = models.TextField('Ситуация')
    created_at = models.DateTimeField('Когда', default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'запись дневника'
        verbose_name_plural = 'записи дневника'

    def __str__(self):
        return f'{self.bias} — {self.created_at:%d.%m.%Y}'


class QuizQuestion(models.Model):
    situation = models.TextField('Ситуация')
    correct_bias = models.ForeignKey(Bias, on_delete=models.CASCADE, related_name='quiz_questions')
    explanation = models.TextField('Объяснение')

    class Meta:
        verbose_name = 'вопрос тренажера'
        verbose_name_plural = 'вопросы тренажера'

    def __str__(self):
        return self.situation[:60]
