import django_filters
from django.db.models import Q
from .models import Note


class NoteFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    start_date = django_filters.DateTimeFilter(field_name='start_time', lookup_expr='gte')
    end_date = django_filters.DateTimeFilter(field_name='end_time', lookup_expr='lte')

    class Meta:
        model = Note
        fields = ['search', 'start_date', 'end_date']

    def filter_search(self, queryset, name, value):
        return queryset.filter(Q(note__icontains=value))

