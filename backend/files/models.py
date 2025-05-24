from django.db import models

# Create your models here.

class ImportJob(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='import_jobs')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=10)  # CSV, XLSX
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    total_records = models.PositiveIntegerField(default=0)
    processed_records = models.PositiveIntegerField(default=0)
    successful_records = models.PositiveIntegerField(default=0)
    failed_records = models.PositiveIntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    column_mapping = models.JSONField(null=True, blank=True)  # Store column mappings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Import {self.file_name} - {self.status}"

class ExportJob(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed')
    ]

    FORMAT_CHOICES = [
        ('CSV', 'CSV'),
        ('XLSX', 'Excel'),
        ('PDF', 'PDF')
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='export_jobs')
    file_name = models.CharField(max_length=255)
    format = models.CharField(max_length=4, choices=FORMAT_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    filters = models.JSONField(null=True, blank=True)  # Store export filters
    date_range = models.JSONField(null=True, blank=True)  # Store date range
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Export {self.file_name} - {self.status}"

class ImportTemplate(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='import_templates')
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    file_type = models.CharField(max_length=10)  # CSV, XLSX
    column_mapping = models.JSONField()  # Store column mappings
    default_values = models.JSONField(null=True, blank=True)  # Store default values
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['file_type']),
        ]

    def __str__(self):
        return self.name
