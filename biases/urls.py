from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'biases'

router = DefaultRouter()
router.register(r'groups', views.BiasGroupViewSet)
router.register(r'biases', views.BiasViewSet)

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('biases/', views.bias_list, name='bias_list'),
    path('biases/<int:pk>/', views.bias_detail, name='bias_detail'),
    path('quiz/', views.quiz, name='quiz'),
    path('manage/', views.manage, name='manage'),

    path('api/catches/', views.api_catch_create, name='api_catch_create'),
    path('api/catches/<int:pk>/delete/', views.api_catch_delete, name='api_catch_delete'),
    path('api/biases/search/', views.api_bias_search, name='api_bias_search'),
    path('api/biases/random/', views.api_bias_random, name='api_bias_random'),
    path('api/quiz/<int:pk>/check/', views.api_quiz_check, name='api_quiz_check'),

    path('api/', include(router.urls)),
]
