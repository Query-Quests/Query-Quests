-- Phase C MySQL operator runbook.
--
-- The init scripts in mysql-init/ only run on a *fresh* MySQL data
-- volume. To apply the Phase C user-level limits to an already-
-- initialized instance (e.g. Railway), connect as root and run:

ALTER USER 'student_readonly'@'%'
  WITH MAX_QUERIES_PER_HOUR 5000
       MAX_USER_CONNECTIONS 50;

ALTER USER 'teacher_preview'@'%'
  WITH MAX_QUERIES_PER_HOUR 20000
       MAX_USER_CONNECTIONS 20;

FLUSH PRIVILEGES;

-- Verify:
--   SHOW CREATE USER 'student_readonly'@'%';
--   SHOW CREATE USER 'teacher_preview'@'%';
