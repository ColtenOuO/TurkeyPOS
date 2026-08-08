"""add_order_no_to_orders

Revision ID: b8d4e2f6a1c3
Revises: a7c3d1e5f9b2
Create Date: 2026-08-07 23:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8d4e2f6a1c3'
down_revision: Union[str, Sequence[str], None] = 'a7c3d1e5f9b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# 只有「尚未完成」的訂單編號不可重複，完成/取消後編號即可回收
ACTIVE_ORDER_NO = "order_no IS NOT NULL AND status NOT IN ('completed', 'cancelled')"


def upgrade() -> None:
    op.add_column('orders', sa.Column('order_no', sa.String(length=5), nullable=True))
    op.create_index('ix_orders_order_no', 'orders', ['order_no'])
    op.create_index(
        'uq_orders_active_order_no',
        'orders',
        ['order_no'],
        unique=True,
        postgresql_where=sa.text(ACTIVE_ORDER_NO),
    )


def downgrade() -> None:
    op.drop_index('uq_orders_active_order_no', table_name='orders')
    op.drop_index('ix_orders_order_no', table_name='orders')
    op.drop_column('orders', 'order_no')
