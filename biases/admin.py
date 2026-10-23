from django.contrib import admin
from .models import Bias, BiasGroup, Catch, QuizQuestion


@admin.register(BiasGroup)
class BiasGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'order']
    list_editable = ['order']


class CatchInline(admin.TabularInline):
    model = Catch
    extra = 1
    fields = ['situation', 'created_at']


@admin.register(Bias)
class BiasAdmin(admin.ModelAdmin):
    list_display = ['name', 'group', 'danger_level']
    list_filter = ['group', 'danger_level']
    search_fields = ['name']
    filter_horizontal = ['related']
    inlines = [CatchInline]


@admin.register(Catch)
class CatchAdmin(admin.ModelAdmin):
    list_display = ['bias', 'created_at']
    list_filter = ['bias__group', 'created_at']
    search_fields = ['situation']
    date_hierarchy = 'created_at'


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'correct_bias']
    list_filter = ['correct_bias__group']
