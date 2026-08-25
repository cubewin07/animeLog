"""
MCP Prompt Templates for AnimeLog.
Provides structured prompt workflows for reflecting on lessons and recommending titles.
"""

def get_reflect_prompt(theme: str = "") -> str:
    """Generate a prompt to reflect on lessons and memories in the journal."""
    theme_clause = f" specifically focusing on the theme of '{theme}'" if theme else ""
    return (
        f"Review the user's AnimeLog journal memories and lessons{theme_clause}. "
        "Summarize the recurring life philosophies, lessons from favorite characters, "
        "and how their reflections evolved through rewatches. "
        "Provide an inspiring summary of the key takeaways."
    )


def get_recommend_prompt(preference: str = "") -> str:
    """Generate a prompt to recommend next watch or read."""
    pref_clause = f" with preference: {preference}" if preference else ""
    return (
        f"Based on the user's highest-rated anime, books, and favorite character archetypes{pref_clause}, "
        "recommend 3 new anime or book titles. For each recommendation, explain why it connects "
        "to the life lessons and philosophical themes they appreciate in their existing journal."
    )
