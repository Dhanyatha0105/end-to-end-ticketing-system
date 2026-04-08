from rest_framework import serializers
from .models import User, Ticket, LogAttachment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class LogAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogAttachment
        fields = '__all__'
        read_only_fields = ['parsed_summary', 'uploaded_at']

class TicketSerializer(serializers.ModelSerializer):
    logs = LogAttachmentSerializer(many=True, read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    duplicate_info = serializers.JSONField(required=False, read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['category', 'priority', 'status', 'created_at', 'updated_at']
