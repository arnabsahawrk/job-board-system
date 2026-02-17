"""Add missing full_name field to User when DB is out-of-sync.

This migration ensures the `full_name` column exists if the DB was created
before the field was introduced but the migration state was recorded.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("authentications", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="full_name",
            field=models.CharField(max_length=150, default=""),
            preserve_default=False,
        ),
    ]
