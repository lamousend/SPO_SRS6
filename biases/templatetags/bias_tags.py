from django import template
from django.utils import timezone

from biases.models import Bias

register = template.Library()


@register.inclusion_tag('components/_bias_of_day.html')
def bias_of_day():
    biases = Bias.objects.order_by('pk')
    total = biases.count()
    bias = biases[timezone.localdate().toordinal() % total] if total else None
    return {'bias': bias}


@register.inclusion_tag('components/_catch_modal.html')
def catch_modal():
    return {'biases': Bias.objects.order_by('group__order', 'name')}
