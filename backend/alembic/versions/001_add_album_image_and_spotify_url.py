"""Add album_image and spotify_url columns to song_cache

Revision ID: 001_add_album_spotify
Revises: 
Create Date: 2026-02-23 09:54:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_album_spotify'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add album_image and spotify_url columns to song_cache table."""
    # Add album_image column
    op.add_column('song_cache',
                  sa.Column('album_image', sa.String(2048), nullable=True))
    
    # Add spotify_url column
    op.add_column('song_cache',
                  sa.Column('spotify_url', sa.String(2048), nullable=True))


def downgrade() -> None:
    """Remove album_image and spotify_url columns from song_cache table."""
    op.drop_column('song_cache', 'spotify_url')
    op.drop_column('song_cache', 'album_image')
