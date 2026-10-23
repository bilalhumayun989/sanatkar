ALTER TABLE public.profiles ADD COLUMN seller_activation_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.profiles ADD COLUMN seller_payment_proof_path TEXT;
ALTER TABLE public.profiles ADD COLUMN seller_payment_submitted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN seller_payment_reviewed_at TIMESTAMPTZ;
-- Preserve sellers who already had approved access; new sellers must pay.
UPDATE public.profiles SET seller_activation_status = 'approved'
WHERE role IN ('seller', 'professional') AND seller_status = 'approved';
-- Existing unreviewed shop applications continue through the payment step.
UPDATE public.profiles SET role = 'seller', seller_status = 'payment_required'
WHERE role = 'regular' AND seller_status IN ('pending', 'rejected') AND coalesce(shop_name, '') <> '';
CREATE INDEX profiles_seller_activation_review_idx ON public.profiles(seller_activation_status, seller_payment_submitted_at);
