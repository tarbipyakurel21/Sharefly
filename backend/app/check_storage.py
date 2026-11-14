"""Print which storage backend is active. Run: python -m app.check_storage

Prints no credentials. Use it to confirm that Atlas is reachable before a demo.
"""
from __future__ import annotations

from .storage import get_storage


def main() -> None:
    store = get_storage()
    print(f"Active storage backend: {store.name}")
    if store.note:
        print(f"Note: {store.note}")
    datasets = store.list_datasets()
    print(f"Stored investigations: {len(datasets)}")
    for d in datasets[:5]:
        print(f"  #{d['id']} {d['name']} ({d['message_count']} messages, "
              f"{len(store.get_clusters(d['id']))} stored clusters)")


if __name__ == "__main__":
    main()
