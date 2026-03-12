"""add embeddings and duplicate_pairs

Revision ID: 5dd82196eb4a
Revises: 
Create Date: 2026-03-06 10:27:49.325776

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5dd82196eb4a'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('DuplicatePairs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ProductIds', sa.ARRAY(sa.UUID()), nullable=False))
        batch_op.add_column(sa.Column('WinnerId', sa.UUID(), nullable=True))
        batch_op.add_column(sa.Column('Scores', sa.JSON(), nullable=True))
        batch_op.drop_constraint('DuplicatePairs_ProductBId_fkey', type_='foreignkey')
        batch_op.drop_constraint('DuplicatePairs_ProductAId_fkey', type_='foreignkey')
        batch_op.create_foreign_key('DuplicatePairs_WinnerId_fkey', 'Sdata', ['WinnerId'], ['Id'])
        batch_op.drop_column('ProductAId')
        batch_op.drop_column('ProductBId')
        batch_op.drop_column('TextSimilarity')
        batch_op.drop_column('ImageSimilarity')
        batch_op.drop_column('FinalScore')


def downgrade():
    with op.batch_alter_table('DuplicatePairs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('FinalScore', sa.NUMERIC(precision=5, scale=4), nullable=True))
        batch_op.add_column(sa.Column('ImageSimilarity', sa.NUMERIC(precision=5, scale=4), nullable=True))
        batch_op.add_column(sa.Column('TextSimilarity', sa.NUMERIC(precision=5, scale=4), nullable=True))
        batch_op.add_column(sa.Column('ProductBId', sa.UUID(), nullable=False))
        batch_op.add_column(sa.Column('ProductAId', sa.UUID(), nullable=False))
        batch_op.drop_constraint('DuplicatePairs_WinnerId_fkey', type_='foreignkey')
        batch_op.create_foreign_key('DuplicatePairs_ProductAId_fkey', 'Sdata', ['ProductAId'], ['Id'])
        batch_op.create_foreign_key('DuplicatePairs_ProductBId_fkey', 'Sdata', ['ProductBId'], ['Id'])
        batch_op.drop_column('Scores')
        batch_op.drop_column('WinnerId')
        batch_op.drop_column('ProductIds')