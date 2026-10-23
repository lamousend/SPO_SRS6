import random
from datetime import timedelta

from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from .models import Bias, BiasGroup, Catch, QuizQuestion
from .serializers import BiasGroupSerializer, BiasSerializer


def filter_biases(request):
    q = request.GET.get('q', '').strip().lower()
    group = request.GET.get('group', '')

    biases = Bias.objects.annotate(n=Count('catches')).order_by('group__order', 'name')
    if group.isdigit():
        biases = biases.filter(group_id=group)
    biases = [
        bias for bias in biases
        if q in bias.name.lower() or q in bias.short_description.lower()
    ]
    return biases, q, group


def dashboard(request):
    total = Catch.objects.count()
    week_ago = timezone.now() - timedelta(days=7)
    top_biases = Bias.objects.annotate(n=Count('catches')).filter(n__gt=0).order_by('-n', 'name')[:3]

    groups = BiasGroup.objects.annotate(n=Count('biases__catches')).order_by('order')
    for group in groups:
        group.percent = round(group.n * 100 / total) if total else 0

    today = timezone.localdate()
    days = []
    for i in range(13, -1, -1):
        date = today - timedelta(days=i)
        days.append({'date': date, 'count': Catch.objects.filter(created_at__date=date).count()})

    context = {
        'total': total,
        'week': Catch.objects.filter(created_at__gte=week_ago).count(),
        'top_bias': top_biases[0] if top_biases else None,
        'groups': groups,
        'top_biases': top_biases,
        'days': days,
        'max_day_count': max(day['count'] for day in days) or 1,
        'recent_catches': Catch.objects.all()[:5],
    }
    return render(request, 'biases/dashboard.html', context)


def bias_list(request):
    biases, q, group = filter_biases(request)
    context = {
        'biases': biases,
        'groups': BiasGroup.objects.all(),
        'q': q,
        'selected_group': group,
    }
    return render(request, 'biases/bias_list.html', context)


def bias_detail(request, pk):
    bias = get_object_or_404(Bias, pk=pk)
    return render(request, 'biases/bias_detail.html', {'bias': bias, 'catches': bias.catches.all()})


def quiz(request):
    question = QuizQuestion.objects.order_by('?').first()
    options = []
    if question:
        options = list(Bias.objects.exclude(pk=question.correct_bias_id).order_by('?')[:3])
        options.append(question.correct_bias)
        random.shuffle(options)
    return render(request, 'biases/quiz.html', {'question': question, 'options': options})


@require_POST
def api_catch_create(request):
    bias_id = request.POST.get('bias_id', '')
    situation = request.POST.get('situation', '').strip()

    bias = Bias.objects.filter(pk=bias_id).first() if bias_id.isdigit() else None
    if bias is None:
        return JsonResponse({'error': 'Выберите искажение из списка.'}, status=400)
    if not situation:
        return JsonResponse({'error': 'Опишите, что произошло.'}, status=400)

    Catch.objects.create(bias=bias, situation=situation)
    return JsonResponse({'ok': True})


@require_POST
def api_catch_delete(request, pk):
    get_object_or_404(Catch, pk=pk).delete()
    return JsonResponse({'ok': True})


@require_GET
def api_bias_search(request):
    biases, _, _ = filter_biases(request)
    return render(request, 'biases/_bias_grid.html', {'biases': biases})


@require_GET
def api_bias_random(request):
    biases = Bias.objects.all()
    exclude = request.GET.get('exclude', '')
    if exclude.isdigit():
        biases = biases.exclude(pk=exclude)
    bias = biases.order_by('?').first()
    return render(request, 'components/_bias_of_day.html', {'bias': bias, 'is_random': True})


@require_POST
def api_quiz_check(request, pk):
    question = get_object_or_404(QuizQuestion, pk=pk)
    bias_id = request.POST.get('bias_id', '')
    if not bias_id.isdigit():
        return JsonResponse({'error': 'Не выбран вариант ответа.'}, status=400)
    return JsonResponse({
        'correct': int(bias_id) == question.correct_bias_id,
        'correct_id': question.correct_bias_id,
        'correct_name': question.correct_bias.name,
        'explanation': question.explanation,
    })


def manage(request):
    return render(request, 'biases/manage.html', {'color_choices': BiasGroup.COLOR_CHOICES})


class BiasGroupViewSet(viewsets.ModelViewSet):
    queryset = BiasGroup.objects.all()
    serializer_class = BiasGroupSerializer

    def destroy(self, request, *args, **kwargs):
        if self.get_object().biases.exists():
            return Response(
                {'detail': 'Нельзя удалить группу, пока в ней есть искажения.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class BiasViewSet(viewsets.ModelViewSet):
    queryset = Bias.objects.select_related('group')
    serializer_class = BiasSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['group', 'danger_level']
    search_fields = ['name', 'short_description']
    ordering_fields = ['name', 'danger_level']


