# Agensi.io Seller Listing Guide: AnimeLog Companion Skill

Ready-to-use listing package for submitting to [agensi.io/sell](https://www.agensi.io/sell).

---

## 1. Skill Metadata

- **Listing Title:** AnimeLog Companion — Socratic Anime & Book Philosophy Journal
- **Tagline:** Turn watching and reading into lasting life lessons. Live MyAnimeList & OpenLibrary auto-enrichment, Socratic reflection workflows, rewatch evolution diffs, and Obsidian vault export.
- **Category:** Personal Growth / Entertainment / Productivity / Lifestyle
- **Price Recommendation:**
  - **One-time:** \$14.00 (You keep 70% = **\$9.80 / sale**)
  - **Free Tier:** Can also offer free download to build audience and direct users to your GitHub repo.
- **Tags:** `anime`, `manga`, `myanimelist`, `jikan`, `obsidian`, `journaling`, `socratic-reflection`, `philosophy`, `books`, `claude-code`, `cursor`

---

## 2. Listing Description (Markdown)

```markdown
# AnimeLog Companion: Memories and Lessons from Anime & Books 📖✨

Most trackers treat media as a checklist of episode counters. **AnimeLog** was built on a different philosophy: **every story, character, and rewatch is a vessel for personal insights and life lessons.**

Whether you are using **Claude Code, Cursor, Windsurf, Copilot, or Codex CLI**, AnimeLog Companion equips your AI agent with a rich Socratic dialogue framework and live metadata lookup to transform how you remember what you watch and read.

### ✨ What's Inside:
1. **Zero-Key Public Metadata Auto-Enrichment:**
   - 1-command lookup via **MyAnimeList (Jikan v4 API)** and **OpenLibrary API**—auto-fetching Japanese titles, Romaji, episode counts, studios, genres, and high-res poster artwork with zero API keys required.
2. **Socratic Post-Title Reflection:**
   - Instead of generic summaries, your agent interviews you using the 3-question philosophical framework to articulate what you truly learned.
3. **First-Class Rewatch Perspective Diffs:**
   - Track repeat viewings across years. How did *Steins;Gate*, *Evangelion*, or *Frieren* look when you were 25 versus 18?
4. **Favorite Character Virtue Catalog:**
   - Archive characters worth remembering and the specific virtues or ideals they represent.
5. **Obsidian Vault & Markdown Export:**
   - Export your entire journal into clean Markdown notes with YAML frontmatter and `[[wikilinks]]` ready for your Second Brain.
6. **Dual-Mode Operation:**
   - **Mode A (Connected):** Connects to the open-source AnimeLog Django + React web desk and Streamable HTTP MCP server (`http://127.0.0.1:8000`).
   - **Mode B (Standalone):** Works right out of the box using a zero-dependency Python CLI backed by local Markdown and JSON.

### 🚀 Quick Start
```bash
# In Claude Code or Cursor terminal:
python3 scripts/animelog_cli.py lookup-anime "Frieren"
python3 scripts/animelog_cli.py log-anime "Frieren: Beyond Journey's End" --rating 10 --notes "A masterclass on the passage of time and cherishing fleeting moments."
python3 scripts/animelog_cli.py log-character "Himmel" --series "Frieren: Beyond Journey's End" --why "Living courageously so that even fleeting encounters leave warmth."
python3 scripts/animelog_cli.py reflect --title "Vinland Saga" --genre seinen
python3 scripts/animelog_cli.py export-obsidian --out ./my-vault
```
```

---

## 3. Checklist for Submitting to Agensi.io

1. Navigate to **[agensi.io/sell](https://www.agensi.io/sell)** and sign in.
2. Upload the `skills/animelog-journal/` folder (contains `SKILL.md`, `scripts/animelog_cli.py`, `references/`).
3. Set price to **\$14.00** (or your chosen amount).
4. Paste the description above into the listing form.
5. Automated security scan: `scripts/animelog_cli.py` has **zero external package dependencies** and uses standard library only, ensuring an instant pass.
6. Connect your Stripe account for automated monthly payouts.
