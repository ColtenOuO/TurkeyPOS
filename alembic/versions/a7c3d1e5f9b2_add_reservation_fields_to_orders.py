"""add_reservation_fields_to_orders

Revision ID: a7c3d1e5f9b2
Revises: f1a2b3c4d5e6
Create Date: 2026-08-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c3d1e5f9b2'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('is_reservation', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('orders', sa.Column('customer_name', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('customer_unit', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('customer_phone', sa.String(length=30), nullable=True))
    op.add_column('orders', sa.Column('delivery_address', sa.String(length=255), nullable=True))
    op.add_column('orders', sa.Column('pickup_time', sa.DateTime(), nullable=True))
    op.create_index('ix_orders_is_reservation', 'orders', ['is_reservation'])


def downgrade() -> None:
    op.drop_index('ix_orders_is_reservation', table_name='orders')
    op.drop_column('orders', 'pickup_time')
    op.drop_column('orders', 'delivery_address')
    op.drop_column('orders', 'customer_phone')
    op.drop_column('orders', 'customer_unit')
    op.drop_column('orders', 'customer_name')
    op.drop_column('orders', 'is_reservation')
