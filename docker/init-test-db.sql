SELECT 'CREATE DATABASE pcc_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pcc_test')
\gexec
