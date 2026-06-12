from django.urls import path
from .views import RatingCategoryListView, RatingSubmitView, UserRatingsHistoryView

urlpatterns = [
    # Metadata Tag Engine Paths
    path('categories/', RatingCategoryListView.as_view(), name='rating_tags'),
   
    # Execution Paths
    path('submit/', RatingSubmitView.as_view(), name='submit_review'),
   
    # Profile Summary Ledger Paths
    path('history/', UserRatingsHistoryView.as_view(), name='rating_history'),
]
