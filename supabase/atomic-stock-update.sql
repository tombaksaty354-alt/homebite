-- Atomic Stock Update Procedure
-- Prevents race conditions when multiple users order the same product simultaneously
-- Usage: SELECT atomic_reduce_stock('product-uuid', 2);

CREATE OR REPLACE FUNCTION atomic_reduce_stock(
  p_produk_id UUID,
  p_jumlah INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_product_name TEXT;
  v_tersedia BOOLEAN;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT stok, nama, tersedia
  INTO v_current_stock, v_product_name, v_tersedia
  FROM produk
  WHERE id = p_produk_id
  FOR UPDATE;

  -- Product not found
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Produk tidak ditemukan'
    );
  END IF;

  -- Product not available
  IF NOT v_tersedia THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Produk "%s" tidak tersedia', v_product_name)
    );
  END IF;

  -- If stock is tracked (not NULL), check sufficiency
  IF v_current_stock IS NOT NULL THEN
    IF v_current_stock < p_jumlah THEN
      RETURN json_build_object(
        'success', false,
        'error', format('Stok "%s" tidak cukup. Tersedia: %s', v_product_name, v_current_stock)
      );
    END IF;

    -- Reduce stock atomically
    UPDATE produk
    SET stok = stok - p_jumlah
    WHERE id = p_produk_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'remaining_stock', COALESCE(v_current_stock - p_jumlah, NULL)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION atomic_reduce_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_reduce_stock(UUID, INTEGER) TO service_role;

-- Optional: Create an index for faster product lookups during checkout
CREATE INDEX IF NOT EXISTS idx_produk_tersedia ON produk(tersedia) WHERE tersedia = true;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_mitra ON orders(mitra_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
