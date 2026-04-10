-- ============================================
-- RPC Function: process_payout
-- Purpose: Process mitra payout/withdrawal atomically
-- Usage: supabase.rpc('process_payout', { mitra_id: '...', amount: 100000 })
-- ============================================

-- Find and drop ALL existing versions of process_payout (to handle overloaded functions)
-- Run this manually if needed:
-- SELECT routine_name, routine_type, data_type 
-- FROM information_schema.parameters 
-- WHERE specific_name LIKE '%process_payout%';

DO $$ 
BEGIN
  -- Try to drop common signatures
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.process_payout(UUID, NUMERIC) CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.process_payout(UUID, INTEGER) CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.process_payout(TEXT, NUMERIC) CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.process_payout(TEXT, INTEGER) CASCADE';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Create the function
CREATE OR REPLACE FUNCTION public.process_payout(
  mitra_id UUID,
  amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_saldo RECORD;
  new_saldo_tersedia NUMERIC;
  new_total_pencairan NUMERIC;
BEGIN
  -- 1. Validate amount
  IF amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Amount must be greater than 0'
    );
  END IF;

  -- 2. Get current saldo
  SELECT * INTO current_saldo
  FROM mitra_saldo
  WHERE mitra_id = process_payout.mitra_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Mitra saldo account not found'
    );
  END IF;

  -- 3. Check sufficient balance
  IF current_saldo.saldo_tersedia < amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'available', current_saldo.saldo_tersedia,
      'requested', amount
    );
  END IF;

  -- 4. Process payout atomically
  new_saldo_tersedia = current_saldo.saldo_tersedia - amount;
  new_total_pencairan = current_saldo.total_pencairan + amount;

  UPDATE mitra_saldo
  SET 
    saldo_tersedia = new_saldo_tersedia,
    total_pencairan = new_total_pencairan,
    updated_at = NOW()
  WHERE mitra_id = process_payout.mitra_id;

  -- 5. Log payout transaction
  INSERT INTO riwayat_pencairan (
    mitra_id,
    jumlah,
    saldo_sebelum,
    saldo_sesudah,
    status,
    created_at
  ) VALUES (
    mitra_id,
    amount,
    current_saldo.saldo_tersedia,
    new_saldo_tersedia,
    'berhasil',
    NOW()
  );

  -- 6. Return success
  RETURN jsonb_build_object(
    'success', true,
    'mitra_id', mitra_id,
    'amount', amount,
    'new_saldo_tersedia', new_saldo_tersedia,
    'new_total_pencairan', new_total_pencairan
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.process_payout(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payout(UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION public.process_payout IS 'Process mitra payout atomically - reduces saldo_tersedia and increases total_pencairan';
