CREATE OR REPLACE FUNCTION increment_user_time_active()
RETURNS TRIGGER
AS $$
DECLARE
  delta BIGINT;
BEGIN

  IF TG_OP = 'INSERT' THEN
    delta := COALESCE(NEW.duration_seconds, 0);

    INSERT INTO user_stats (user_id, total_time_active_seconds, updated_at)
    VALUES (NEW.user_id, delta, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET
      total_time_active_seconds = COALESCE(user_stats.total_time_active_seconds, 0) + EXCLUDED.total_time_active_seconds,
      updated_at = NOW();

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    delta := COALESCE(NEW.duration_seconds, 0) - COALESCE(OLD.duration_seconds, 0);

    IF delta <> 0 THEN
      INSERT INTO user_stats (user_id, total_time_active_seconds, updated_at)
      VALUES (NEW.user_id, delta, NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET
        total_time_active_seconds = COALESCE(user_stats.total_time_active_seconds, 0) + EXCLUDED.total_time_active_seconds,
        updated_at = NOW();
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_increment_user_time_active
AFTER INSERT OR UPDATE ON activity_sessions
FOR EACH ROW
EXECUTE FUNCTION increment_user_time_active();


