from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Bias, BiasGroup


class BiasGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiasGroup
        fields = ['id', 'name', 'color', 'description', 'order']


class BiasSerializer(serializers.ModelSerializer):
    group_name = serializers.CharField(source='group.name', read_only=True)
    name = serializers.CharField(
        max_length=150,
        validators=[UniqueValidator(queryset=Bias.objects.all(), message='Искажение с таким названием уже есть.')],
    )

    class Meta:
        model = Bias
        fields = [
            'id', 'group', 'group_name', 'name', 'short_description', 'full_description',
            'example', 'how_to_fight', 'source', 'danger_level', 'related',
        ]
