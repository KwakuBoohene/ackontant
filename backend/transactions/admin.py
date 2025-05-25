from django.contrib import admin
from .models import Transaction, Tag, Category

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'account', 'amount', 'currency', 'type', 'category', 'date', 'is_recurring')
    list_filter = ('type', 'category', 'is_recurring', 'date')
    search_fields = ('description', 'user__email', 'account__name')
    raw_id_fields = ('user', 'account', 'currency')
    date_hierarchy = 'date'
    ordering = ('-date',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'type', 'parent', 'color', 'icon', 'is_active')
    list_filter = ('type', 'is_active', 'user')
    search_fields = ('name', 'user__email')
    raw_id_fields = ('user', 'parent')
    ordering = ('type', 'name')

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'color', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'user__email')
    raw_id_fields = ('user',)
    ordering = ('name',)
