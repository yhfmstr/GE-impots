-- ==========================================
-- GE-Impots Audit Trail Enhancements
-- Migration: 003_audit_enhancements
-- ==========================================

-- ==========================================
-- ENHANCED AUDIT LOGGING
-- ==========================================

-- Add more detail columns to audit_log
ALTER TABLE public.audit_log
ADD COLUMN IF NOT EXISTS old_values JSONB,
ADD COLUMN IF NOT EXISTS new_values JSONB,
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.profiles(id);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity_type, entity_id);

-- ==========================================
-- ADMIN ACTION AUDIT FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_log (
    profile_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    details,
    performed_by
  )
  VALUES (
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_details,
    auth.uid()
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DECLARATION STATUS CHANGE AUDIT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.audit_declaration_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.log_admin_action(
      'declaration_status_change',
      'declaration',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      jsonb_build_object(
        'tax_year', NEW.tax_year,
        'profile_id', NEW.profile_id,
        'reviewed_by', NEW.reviewed_by,
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_declaration_status ON public.declarations;
CREATE TRIGGER audit_declaration_status
  AFTER UPDATE ON public.declarations
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.audit_declaration_status_change();

-- ==========================================
-- PROFILE ROLE CHANGE AUDIT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.audit_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_admin_action(
      'role_change',
      'profile',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      jsonb_build_object(
        'email', NEW.email,
        'name', CONCAT(NEW.first_name, ' ', NEW.last_name)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_role_change ON public.profiles;
CREATE TRIGGER audit_role_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.audit_role_change();

-- ==========================================
-- LOGIN AUDIT (called from application)
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_user_login(
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  RETURN public.log_admin_action(
    'user_login',
    'profile',
    auth.uid(),
    NULL,
    NULL,
    jsonb_build_object(
      'ip_address', p_ip_address::TEXT,
      'user_agent', p_user_agent,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ADMIN AUDIT VIEW
-- ==========================================

CREATE OR REPLACE VIEW public.admin_audit_view AS
SELECT
  a.id,
  a.action,
  a.entity_type,
  a.entity_id,
  a.old_values,
  a.new_values,
  a.details,
  a.created_at,
  p1.email AS user_email,
  p1.first_name || ' ' || p1.last_name AS user_name,
  p2.email AS performed_by_email
FROM public.audit_log a
LEFT JOIN public.profiles p1 ON a.profile_id = p1.id
LEFT JOIN public.profiles p2 ON a.performed_by = p2.id
ORDER BY a.created_at DESC;

-- Grant access to admins only
GRANT SELECT ON public.admin_audit_view TO authenticated;

-- ==========================================
-- RLS FOR AUDIT VIEW
-- ==========================================

-- Note: Views inherit RLS from underlying tables
-- Admins already have SELECT access via existing policies
