from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.template import TemplateDoesNotExist
from django.views.generic import TemplateView


class FrontendAppView(TemplateView):
    template_name = "index.html"

    def get(self, request, *args, **kwargs):
        try:
            return super().get(request, *args, **kwargs)
        except TemplateDoesNotExist:
            dist_path = Path(settings.BASE_DIR) / "my-react-app" / "dist" / "index.html"
            return HttpResponse(
                (
                    "Frontend build not found. "
                    f"Expected file: {dist_path}. "
                    "Use the Vite dev server on port 5173 or run `npm run build`."
                ),
                content_type="text/plain; charset=utf-8",
                status=503,
            )


def healthcheck(_request):
    return JsonResponse({"status": "ok"})
