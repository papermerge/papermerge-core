"""
CLI commands for managing the PostgreSQL-based document search index.

This module provides typer commands for:
- Building/rebuilding the entire search index
- Indexing specific documents
- Viewing index statistics
- Finding and fixing unindexed documents
"""

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

from papermerge.core.db.engine import AsyncSessionLocal
from papermerge.core.features.search.db import api as dbapi
from papermerge.core.utils.cli import async_command

app = typer.Typer(help="Search Index Management")
console = Console()


@app.command("build")
@async_command
async def build_index():
    """
    Build the search index by indexing all documents.

    This command will clear the existing search index and rebuild it
    from scratch by calling the PostgreSQL upsert_document_search_index
    function for each document in the database.

    The index includes:
    - Document titles
    - Document types/categories
    - Tags
    - Custom field values (text-based)
    - Full-text search vectors (tsvector)

    Note: The search index is normally maintained automatically by
    database triggers. Use this command only when:
    - Setting up a new system
    - Recovering from index corruption
    - After database migrations
    """
    console.print("[bold blue]Starting search index build...[/bold blue]\n")

    async with AsyncSessionLocal() as db_session:
        with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TaskProgressColumn(),
                console=console,
        ) as progress:
            task = progress.add_task("Rebuilding search index...", total=None)

            try:
                count = await dbapi.rebuild_document_search_index(db_session)

                progress.update(task, completed=True)
                console.print(
                    f"\n[bold green]✓[/bold green] Successfully indexed "
                    f"{count} documents"
                )

            except Exception as e:
                console.print(f"\n[bold red]✗[/bold red] Error: {e}")
                raise typer.Exit(code=1)


@app.command("reindex")
@async_command
async def reindex_documents(
        document_ids: list[str] = typer.Argument(
            ...,
            help="Document IDs to reindex (UUIDs)"
        )
):
    """
    Reindex specific documents by their IDs.

    This is useful when you want to update the search index for
    specific documents without rebuilding the entire index.

    Example:
        papermerge-cli search-index reindex 123e4567-e89b-12d3-a456-426614174000
    """
    import uuid

    # Convert string IDs to UUIDs
    try:
        uuids = [uuid.UUID(doc_id) for doc_id in document_ids]
    except ValueError as e:
        console.print(f"[bold red]✗[/bold red] Invalid UUID format: {e}")
        raise typer.Exit(code=1)

    console.print(
        f"[bold blue]Reindexing {len(uuids)} document(s)...[/bold blue]\n"
    )

    async with AsyncSessionLocal() as db_session:
        try:
            count = await dbapi.index_specific_documents(db_session, uuids)

            console.print(
                f"[bold green]✓[/bold green] Successfully reindexed "
                f"{count} document(s)"
            )

        except Exception as e:
            console.print(f"[bold red]✗[/bold red] Error: {e}")
            raise typer.Exit(code=1)


@app.command("stats")
@async_command
async def show_stats():
    """
    Show statistics about the document search index.

    Displays:
    - Total documents in the database
    - Documents in the search index
    - Documents missing from the index
    - Index size on disk
    """
    async with AsyncSessionLocal() as db_session:
        try:
            stats = await dbapi.get_document_search_index_stats(db_session)

            # Create a table for display
            table = Table(title="Document Search Index Statistics", show_header=True)
            table.add_column("Metric", style="cyan", no_wrap=True)
            table.add_column("Value", style="green")

            table.add_row("Total Documents", str(stats["total_documents"]))
            table.add_row("Indexed Documents", str(stats["indexed_documents"]))
            table.add_row("Missing from Index", str(stats["missing_from_index"]))
            table.add_row("Index Size", stats["index_size"])

            console.print(table)

            # Show warning if documents are missing
            if stats["missing_from_index"] > 0:
                console.print(
                    f"\n[yellow]⚠[/yellow]  {stats['missing_from_index']} "
                    f"document(s) are not indexed."
                )
                console.print(
                    "Run [bold]papermerge-cli search-index fix[/bold] to reindex them."
                )

        except Exception as e:
            console.print(f"[bold red]✗[/bold red] Error: {e}")
            raise typer.Exit(code=1)


@app.command("fix")
@async_command
async def fix_missing():
    """
    Find and reindex documents that are missing from the search index.

    This command:
    1. Finds documents that exist in the database but not in the search index
    2. Reindexes those documents

    Use this when the index is out of sync with the database.
    """
    console.print("[bold blue]Finding missing documents...[/bold blue]\n")

    async with AsyncSessionLocal() as db_session:
        try:
            # Find unindexed documents
            missing_ids = await dbapi.find_unindexed_documents(db_session)

            if not missing_ids:
                console.print(
                    "[bold green]✓[/bold green] All documents are indexed!"
                )
                return

            console.print(
                f"[yellow]Found {len(missing_ids)} unindexed document(s)[/yellow]\n"
            )

            # Ask for confirmation
            if not typer.confirm("Do you want to reindex them now?"):
                console.print("Cancelled.")
                raise typer.Exit(code=0)

            # Reindex missing documents
            console.print("\n[bold blue]Reindexing...[/bold blue]\n")

            with Progress(
                    SpinnerColumn(),
                    TextColumn("[progress.description]{task.description}"),
                    BarColumn(),
                    TaskProgressColumn(),
                    console=console,
            ) as progress:
                task = progress.add_task(
                    f"Indexing {len(missing_ids)} documents...",
                    total=None
                )

                count = await dbapi.index_specific_documents(db_session, missing_ids)

                progress.update(task, completed=True)

            console.print(
                f"\n[bold green]✓[/bold green] Successfully reindexed "
                f"{count} document(s)"
            )

        except Exception as e:
            console.print(f"\n[bold red]✗[/bold red] Error: {e}")
            raise typer.Exit(code=1)


@app.command("clear")
@async_command
async def clear_index():
    """
    Clear the entire search index.

    WARNING: This will remove all entries from the search index.
    Documents will not be searchable until you rebuild the index
    using the 'build' command.

    Use with caution!
    """
    # Ask for confirmation
    console.print(
        "[bold red]WARNING:[/bold red] This will clear the entire search index!"
    )
    console.print("Documents will not be searchable until you rebuild the index.\n")

    if not typer.confirm("Are you sure you want to continue?"):
        console.print("Cancelled.")
        raise typer.Exit(code=0)

    async with AsyncSessionLocal() as db_session:
        try:
            from sqlalchemy import text

            await db_session.execute(text("DELETE FROM document_search_index"))
            await db_session.commit()

            console.print(
                "\n[bold green]✓[/bold green] Search index cleared successfully"
            )
            console.print(
                "\nRun [bold]papermerge-cli search-index build[/bold] "
                "to rebuild the index."
            )

        except Exception as e:
            console.print(f"[bold red]✗[/bold red] Error: {e}")
            raise typer.Exit(code=1)
