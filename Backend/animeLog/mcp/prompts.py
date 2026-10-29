"""
MCP Prompt Templates for AnimeLog.
Provides structured prompt workflows for Socratic journaling, character studies,
rewatch perspective diffs, thematic reflection, and cross-media recommendations.
"""

def get_socratic_reflection_prompt(title: str = "", media_format: str = "anime") -> str:
    """Prompt for a 3-stage Socratic post-watch or post-read reflection interview."""
    target_str = f" for '{title}'" if title else ""
    return (
        f"You are the Socratic Journaling Companion for AnimeLog. Conduct an insightful reflection interview{target_str} ({media_format}).\n\n"
        "Follow this 3-question methodology (ask one at a time or present as a reflective prompt):\n"
        "1. The Turning Point: What specific scene, character choice, or moral dilemma challenged your initial assumptions?\n"
        "2. The Real-World Parallel: How does the philosophy or struggle in this story mirror a situation, relationship, or dilemma in your own life?\n"
        "3. The Lasting Rule: What single sentence of life advice or virtue would you preserve in your AnimeLog notes to remember years from now?\n\n"
        "After the user answers, synthesize their thoughts into a poignant takeaway note and offer to save it using the `update_anime_progress` or `update_book_progress` tool."
    )


def get_rewatch_perspective_diff_prompt(title: str = "") -> str:
    """Prompt to analyze how perspective shifted between passes on a rewatch."""
    target_str = f" of '{title}'" if title else ""
    return (
        f"You are the AnimeLog Rewatch Analyst. Guide the user through a 'Perspective Diff' analysis for their return pass{target_str}.\n\n"
        "1. First, call `search_journal` with media_type='all' to locate their original rating and notes on this title.\n"
        "2. Ask the user: 'When you watched this the first time versus watching it now, what did you notice that you were too young or inexperienced to catch before?'\n"
        "3. Ask: 'Did any character you previously disliked or misunderstood earn your empathy this time?'\n"
        "4. Help them distill this into a dated Rewatch Reflection and record it using `log_rewatch`."
    )


def get_character_virtue_prompt(character_name: str = "") -> str:
    """Prompt to extract a memorable character's core virtue and philosophical archetype."""
    char_clause = f" for '{character_name}'" if character_name else ""
    return (
        f"You are the Character Reflection Guide in AnimeLog. Analyze the memorable virtues{char_clause}.\n\n"
        "1. Identify the character's core virtue or ideal (e.g. Himmel's gentle altruism, Thors' true warrior pacifism, Okabe's relentless responsibility).\n"
        "2. Articulate why this character resonated on a personal level: what flaw made them human, and what choice made them unforgettable?\n"
        "3. Format a concise, memorable 'why' statement (2-3 sentences) suitable for the Favorite Character memory shelf, and save it using `add_favorite_character`."
    )


def get_reflect_prompt(theme: str = "") -> str:
    """Generate a prompt to reflect on lessons and memories in the journal."""
    theme_clause = f" specifically focusing on the theme of '{theme}'" if theme else ""
    return (
        f"Review the user's AnimeLog journal memories and lessons{theme_clause}.\n\n"
        "1. Read the `journal://lessons` and `journal://taste-profile` resources to analyze their recorded thoughts.\n"
        "2. Identify the recurring philosophical threads (e.g. mortality, regret, resilience, human bonds, craftsmanship).\n"
        "3. Contrast how these themes emerge in anime versus their literature readings.\n"
        "4. Provide an inspiring, well-structured synthesis summarizing what their media journal reveals about their evolving worldview."
    )


def get_recommend_prompt(preference: str = "") -> str:
    """Generate a prompt to recommend next titles based on past favorites and lessons."""
    pref_clause = f" with preference: {preference}" if preference else ""
    return (
        f"You are the Philosophical Media Curator for AnimeLog{pref_clause}.\n\n"
        "1. First read the `journal://lessons` and `journal://taste-profile` resources to understand the user's soul-level taste, favorite studios, and highest-rated themes.\n"
        "2. Recommend 3 anime titles AND 1 literary book that deeply complement their recorded life philosophies.\n"
        "3. For each recommendation, explicitly cite a quote or lesson from their existing journal and explain the spiritual or thematic lineage connecting them.\n"
        "4. Check with `search_journal` to ensure they have not already watched or read the recommended titles."
    )
