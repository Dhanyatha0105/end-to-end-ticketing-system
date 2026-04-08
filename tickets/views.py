from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User, Ticket, LogAttachment
from .serializers import UserSerializer, TicketSerializer, LogAttachmentSerializer
from services.ml_service import predict_category, predict_priority, find_duplicate

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer

    def create(self, request, *args, **kwargs):
        description = request.data.get('description', '')
        ignore_duplicates = request.data.get('ignore_duplicates', False)
        
        # 1. Check for duplicate unless explicitly ignored
        if not ignore_duplicates:
            dup_info = find_duplicate(description)
            if dup_info:
                return Response(
                    {"detail": "Possible duplicate issue detected.", "duplicate_info": dup_info},
                    status=status.HTTP_409_CONFLICT
                )
            
        # 2. Predict Category and Priority
        category = predict_category(description)
        priority = predict_priority(description)
        
        # 3. Create Ticket
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Note: Since auth might not be set up, defaulting created_by to first user if none
        user = User.objects.first()
        serializer.save(
            category=category, 
            priority=priority, 
            created_by=user if user else None
        )
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class LogAttachmentViewSet(viewsets.ModelViewSet):
    queryset = LogAttachment.objects.all()
    serializer_class = LogAttachmentSerializer

    def perform_create(self, serializer):
        # Read file context to extract typical errors
        uploaded_file = self.request.FILES.get('file')
        summary = ""
        if uploaded_file:
            try:
                # Read first few KB to summarize
                content = uploaded_file.read().decode('utf-8')
                errors = [line for line in content.split('\n') if 'error' in line.lower() or 'exception' in line.lower()]
                if errors:
                    summary = "Found errors:\n" + "\n".join(errors[:5]) # Store up to 5 error lines
                else:
                    summary = "No obvious errors found in log."
            except Exception as e:
                summary = f"Could not parse file: {str(e)}"
                
        serializer.save(parsed_summary=summary)
