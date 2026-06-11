import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Rating(models.Model):
    """
    Ratings and reviews for completed rides.
    Both riders and drivers can rate each other.
    """
   
    class RaterType(models.TextChoices):
        RIDER = 'rider', 'Rider'
        DRIVER = 'driver', 'Driver'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ride = models.ForeignKey(
        'rides.Ride',
        on_delete=models.CASCADE,
        related_name='ratings'
    )
   
    # Who is rating and who is being rated
    rater = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='ratings_given'
    )
    rated_user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='ratings_received'
    )
    rater_type = models.CharField(max_length=10, choices=RaterType.choices)
   
    # Rating value
    score = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
   
    # Optional review text
    comment = models.TextField(blank=True)
   
    # Specific feedback categories
    categories = models.ManyToManyField(
        'RatingCategory',
        blank=True,
        related_name='ratings'
    )
   
    # Moderation
    is_flagged = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True)
   
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        db_table = 'ratings'
        unique_together = ['ride', 'rater']  # One rating per ride per user
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['rated_user', 'created_at']),
            models.Index(fields=['ride', 'rater_type']),
        ]
   
    def __str__(self):
        return f'{self.rater.email} rated {self.rated_user.email} - {self.score}/5'
   
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
       
        # Update the rated user's average rating
        if is_new:
            self.rated_user.update_rating(self.score)


class RatingCategory(models.Model):
    """
    Predefined feedback categories for ratings.
    Different categories for rider and driver ratings.
    """
   
    class CategoryType(models.TextChoices):
        POSITIVE = 'positive', 'Positive'
        NEGATIVE = 'negative', 'Negative'
   
    class AppliesTo(models.TextChoices):
        RIDER = 'rider', 'Rider'
        DRIVER = 'driver', 'Driver'
        BOTH = 'both', 'Both'
   
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
   
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon name for mobile app
   
    category_type = models.CharField(max_length=10, choices=CategoryType.choices)
    applies_to = models.CharField(max_length=10, choices=AppliesTo.choices)
   
    # For feedback categories that should trigger review
    triggers_review = models.BooleanField(default=False)
   
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
   
    class Meta:
        db_table = 'rating_categories'
        ordering = ['display_order', 'name']
        verbose_name_plural = 'Rating categories'
   
    def __str__(self):
        return f'{self.name} ({self.category_type})'

