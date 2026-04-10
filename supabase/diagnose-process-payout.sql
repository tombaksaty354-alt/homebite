-- ============================================
-- DIAGNOSTIC: Find all process_payout functions
-- Run this FIRST to see what functions exist
-- ============================================

-- List ALL process_payout functions with their signatures
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  n.nspname AS schema_name,
  p.proowner::regrole AS owner,
  p.pronargs AS num_args,
  string_format_type(p.proargtypes) AS arg_types
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'process_payout'
  AND n.nspname = 'public'
ORDER BY p.oid;

-- Alternative simpler query
SELECT 
  routine_name,
  specific_name,
  data_type
FROM information_schema.routines
WHERE routine_name = 'process_payout'
  AND routine_schema = 'public';

-- Get parameter details
SELECT 
  r.routine_name,
  r.specific_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p 
  ON r.specific_name = p.specific_name
WHERE r.routine_name = 'process_payout'
  AND r.routine_schema = 'public'
  AND p.parameter_mode = 'IN'
ORDER BY r.specific_name, p.ordinal_position;
