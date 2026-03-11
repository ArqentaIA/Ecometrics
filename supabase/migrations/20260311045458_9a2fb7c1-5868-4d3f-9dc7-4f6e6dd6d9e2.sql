
-- ============================================================
-- FASE 1: ESTRUCTURA COMPLETA DE BASE DE DATOS
-- Sistema industrial de control de materiales con roles,
-- bitácora, materiales adicionales y parámetros del sistema
-- ============================================================

-- 1. EXPANDIR ENUM DE ROLES
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direccion';
