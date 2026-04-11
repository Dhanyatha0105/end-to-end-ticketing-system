import uuid
from django.db import models

class MLMetadata(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model_name = models.CharField(max_length=255)
    last_trained = models.DateTimeField(auto_now_add=True)
    accuracy = models.FloatField(default=0.0)
    details = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.model_name} (Acc: {self.accuracy:.2f})"
