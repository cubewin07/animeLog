"""
Django Management Command: run_mcp

Runs the AnimeLog MCP server.
Supports transports:
  --transport streamable-http (default)
  --transport stdio
"""

from django.core.management.base import BaseCommand
from animeLog.mcp.server import mcp_server


class Command(BaseCommand):
    help = "Run the AnimeLog Model Context Protocol (MCP) Server"

    def add_arguments(self, parser):
        parser.add_argument(
            "--transport",
            type=str,
            default="streamable-http",
            choices=["streamable-http", "stdio", "sse"],
            help="Transport protocol: 'streamable-http' (default), 'stdio', or 'sse'.",
        )
        parser.add_argument(
            "--host",
            type=str,
            default="127.0.0.1",
            help="Host to bind for HTTP/SSE (default: 127.0.0.1).",
        )
        parser.add_argument(
            "--port",
            type=int,
            default=8000,
            help="Port to bind for standalone HTTP/SSE (default: 8000).",
        )

    def handle(self, *args, **options):
        transport = options["transport"]
        host = options["host"]
        port = options["port"]

        self.stdout.write(
            self.style.SUCCESS(
                f"Starting AnimeLog MCP Server with transport='{transport}'..."
            )
        )

        if transport == "stdio":
            mcp_server.run(transport="stdio")
        elif transport == "streamable-http":
            mcp_server.run(transport="streamable-http", host=host, port=port)
        elif transport == "sse":
            mcp_server.run(transport="sse", host=host, port=port)
