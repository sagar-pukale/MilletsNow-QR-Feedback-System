select
  (select count(*) from public.feedback) as feedback_count,
  (select count(*) from public.questions) as questions_count,
  (select count(*) from public.compliments) as compliments_count,
  (select count(*) from public.complaints) as complaints_count,
  (select count(*) from public.products) as products_count,
  (select count(*) from public.qr_codes) as qr_codes_count,
  (select count(*) from public.customers) as customers_count,
  (select count(*) from public.qr_scan_logs) as qr_scans_count;
