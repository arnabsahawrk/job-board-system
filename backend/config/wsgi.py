import os
from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Get the Django application
application = get_wsgi_application()

# Use WhiteNoise for serving static files in production
if os.environ.get("VERCEL") == "1":
    application = WhiteNoise(
        application,
        root=os.path.join(os.path.dirname(__file__), "../staticfiles"),
        index_file=True,
        max_age=31536000,  # Cache static files for 1 year
        mimetypes={
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
        },
    )
