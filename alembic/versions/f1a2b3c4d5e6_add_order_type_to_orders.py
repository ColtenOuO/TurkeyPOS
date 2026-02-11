"""add_order_type_to_orders

Revision ID: f1a2b3c4d5e6
Revises: 0eb0e3db6657
Create Date: 2026-02-11 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '0eb0e3db6657'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('order_type', sa.String(length=20), nullable=False, server_default='dine_in'))


def downgrade() -> None:
    op.drop_column('orders', 'order_type')
