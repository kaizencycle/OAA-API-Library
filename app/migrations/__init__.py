# app/migrations/__init__.py
"""
Database migrations for OAA Learning Hub

These migrations are designed for Alembic integration with PostgreSQL.
For the current in-memory implementation, modules are loaded in learning_store.py.

Migrations:
- 001_learning_tables: Creates base learning_modules table
- 002_stem_modules: Adds 15 STEM learning modules (1,465 MIC potential)

Usage with Alembic:
    alembic upgrade head
    alembic downgrade -1
"""
