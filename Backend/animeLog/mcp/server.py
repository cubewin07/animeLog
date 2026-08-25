"""
MCPServer instance for AnimeLog.

Registers all journaling, franchise management, and progress tracking tools,
along with resources and prompts conforming to the Streamable HTTP standard.
"""

from mcp.server import MCPServer
from . import tools, resources, prompts

# Create the MCP Server instance
mcp_server = MCPServer(
    name="AnimeLog Journal",
    instructions=(
        "You are the personal secretary and journal assistant for AnimeLog. "
        "The user's journal is not just a catalog, but a sanctuary for memories, reflections, "
        "and life lessons learned from watching anime and reading books. "
        "Help the user log franchises, record seasons and movies, update watching/reading progress, "
        "save memorable quotes and lessons in notes, record rewatch passes, and catalog favorite characters. "
        "Always search first if you are unsure if a series or book already exists."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Register Tools
# ---------------------------------------------------------------------------

# Exploration & Search
mcp_server.add_tool(tools.search_journal)
mcp_server.add_tool(tools.get_journal_overview)
mcp_server.add_tool(tools.get_series_detail)
mcp_server.add_tool(tools.get_book_detail)
mcp_server.add_tool(tools.list_genres_and_studios)
mcp_server.add_tool(tools.add_genre)
mcp_server.add_tool(tools.add_studio)

# Anime Franchises & Progress
mcp_server.add_tool(tools.log_anime_series)
mcp_server.add_tool(tools.update_anime_series)
mcp_server.add_tool(tools.add_anime_season)
mcp_server.add_tool(tools.update_anime_season)
mcp_server.add_tool(tools.add_anime_movie)
mcp_server.add_tool(tools.update_anime_movie)
mcp_server.add_tool(tools.update_anime_progress)
mcp_server.add_tool(tools.add_episode_note)

# Rewatches & Favorite Characters
mcp_server.add_tool(tools.log_rewatch)
mcp_server.add_tool(tools.update_rewatch)
mcp_server.add_tool(tools.add_favorite_character)
mcp_server.add_tool(tools.update_favorite_character)

# Books
mcp_server.add_tool(tools.log_book)
mcp_server.add_tool(tools.update_book_progress)

# ---------------------------------------------------------------------------
# Register Resources
# ---------------------------------------------------------------------------

@mcp_server.resource("journal://stats")
async def resource_stats() -> str:
    """Current journal statistics (active watching/reading, completed counts, lessons)."""
    return await resources.get_stats_resource()


@mcp_server.resource("journal://active")
async def resource_active() -> str:
    """List of currently active anime and books being watched or read."""
    return await resources.get_active_resource()


@mcp_server.resource("journal://lessons")
async def resource_lessons() -> str:
    """All reflection notes and life lessons recorded across anime, books, characters, and rewatches."""
    return await resources.get_lessons_resource()

# ---------------------------------------------------------------------------
# Register Prompts
# ---------------------------------------------------------------------------

@mcp_server.prompt("reflect_on_lessons")
def prompt_reflect(theme: str = "") -> str:
    """Prompt to synthesize and reflect upon lessons in the journal."""
    return prompts.get_reflect_prompt(theme)


@mcp_server.prompt("recommend_from_journal")
def prompt_recommend(preference: str = "") -> str:
    """Prompt to recommend next titles based on past favorites and lessons."""
    return prompts.get_recommend_prompt(preference)
