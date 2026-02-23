# Database Migration Guide: Add Album Image and Spotify URL to SongCache

## Overview
This migration adds two new nullable columns to the `song_cache` table to store album artwork and Spotify track links for enriched recommendations.

## Changes

### 1. New SongCache Columns
```sql
ALTER TABLE song_cache ADD COLUMN album_image VARCHAR(2048) NULLABLE;
ALTER TABLE song_cache ADD COLUMN spotify_url VARCHAR(2048) NULLABLE;
```

### 2. Alembic Migration Script
If using Alembic for migrations, generate and run:

```bash
alembic revision --autogenerate -m "Add album_image and spotify_url to song_cache"
alembic upgrade head
```

### 3. Migration File Template (if manual)
```python
# migration_file: alembic/versions/xxxx_add_album_fields_to_song_cache.py

from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('song_cache', sa.Column('album_image', sa.String(2048), nullable=True))
    op.add_column('song_cache', sa.Column('spotify_url', sa.String(2048), nullable=True))

def downgrade():
    op.drop_column('song_cache', 'spotify_url')
    op.drop_column('song_cache', 'album_image')
```

## Data Safety
- **Backward Compatible**: Existing rows will have NULL values for new columns
- **No Data Loss**: No existing columns are modified or removed
- **Graceful Degradation**: Frontend can safely handle NULL values for album_image and spotify_url
- **Zero Downtime**: Can run migration while service is running

## Testing

### Unit Test Example
```python
async def test_enrichment_with_album_data():
    """Test that enriched recommendations include album_image and spotify_url."""
    result = await _enrich_recommendation_with_spotify(
        "Shape of You", "Ed Sheeran", access_token, user, db
    )
    
    assert result is not None
    assert "album_image" in result
    assert "spotify_url" in result
    assert result["album_image"] is not None
    assert result["spotify_url"] is not None
```

## API Response Structure
After this upgrade, recommendation endpoints will return:

```json
{
  "id": "0VjIjW4GlUZAMYd2vXMwbm",
  "title": "Shape of You",
  "artist": "Ed Sheeran",
  "release_year": 2017,
  "duration_ms": 233840,
  "album_image": "https://i.scdn.co/image/...",
  "spotify_url": "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMwbm"
}
```

## Rollback Plan
If issues arise:

```bash
alembic downgrade -1
```

This will safely remove the new columns while preserving all existing data.

## Notes

1. **Image URLs**: Spotify provides up to 3 image sizes. This captures the largest available (typically 640x640)
2. **Safe Extraction**: Uses `.get()` chaining to prevent KeyError if images array is empty
3. **Spotify Links**: External URLs are guaranteed by Spotify API for all tracks
4. **No Breaking Changes**: Clients can safely ignore the new fields if not needed
5. **String Length**: Set to 2048 chars to accommodate full Spotify image URLs

## Deployment Steps

1. Code Deploy (this change)
2. Run migration: `alembic upgrade head`
3. Restart FastAPI service
4. Verify with a test recommendation request
5. Check database: `SELECT album_image, spotify_url FROM song_cache LIMIT 5;`

## Timeline
- **Migration Time**: < 1 second
- **Service Restart**: < 10 seconds
- **Full Propagation**: Next recommendation generated will include new fields
