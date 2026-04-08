from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Ticket, LogAttachment

admin.site.register(User, UserAdmin)
admin.site.register(Ticket)
admin.site.register(LogAttachment)
