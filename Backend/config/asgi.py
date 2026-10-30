"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 1. Initialize Django ASGI application first so models and settings load
django_asgi = get_asgi_application()

# 2. Initialize FastMCP Streamable HTTP app
from animeLog.mcp.server import mcp_server

mcp_asgi = mcp_server.streamable_http_app(streamable_http_path='/mcp')


async def application(scope, receive, send):
    """
    Composite ASGI application routing:
    - lifespan -> MCP ASGI application (initializes background session manager)
    - /mcp (and /mcp/*) -> MCP Streamable HTTP endpoint
    - Everything else -> Django ASGI application (/api/*, /admin/*, etc.)
    """
    scope_type = scope.get("type")
    if scope_type == "lifespan":
        await mcp_asgi(scope, receive, send)
        return

    path = scope.get("path", "")
    if scope_type in ("http", "websocket") and (path.rstrip("/") == "/mcp" or path.startswith("/mcp/")):
        await mcp_asgi(scope, receive, send)
    else:
        await django_asgi(scope, receive, send)


