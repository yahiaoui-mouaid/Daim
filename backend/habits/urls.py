from django.urls import path
from . import views

urlpatterns = [
    path('habits/', views.HabitListCreateView.as_view(), name='habit-list'),
    
    # Note: DRF's default lookup kwarg is 'pk'. 
    # Even though your docstring says <habit_id>, HabitDetailView expects <pk> 
    # unless you explicitly set `lookup_url_kwarg = "habit_id"` on the view class.
    path('habits/<int:pk>/', views.HabitDetailView.as_view(), name='habit-detail'),
    
    path('habits/<int:habit_id>/logs/', views.HabitLogListCreateView.as_view(), name='habit-log-list'),
    path('habits/<int:habit_id>/logs/<int:log_id>/', views.HabitLogDetailView.as_view(), name='habit-log-detail'),
]

