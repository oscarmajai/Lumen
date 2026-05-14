-- ============================================================
-- LUMEN — Esquema inicial multi-tenant
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------
-- FASE 1: Tenants
-- -------------------------------------------------------
CREATE TABLE companies (
    id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 1 & 4: Usuarios
-- -------------------------------------------------------
CREATE TABLE users (
    id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
    company_id           CHAR(36)     NOT NULL,
    name                 VARCHAR(255) NOT NULL,
    email                VARCHAR(255) NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    role                 ENUM('OWNER','ADMIN','EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
    must_change_password TINYINT(1)   NOT NULL DEFAULT 0,
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    last_login_at        TIMESTAMP    NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_email_per_company (email, company_id),
    INDEX idx_company_id (company_id),
    INDEX idx_role (role),
    CONSTRAINT fk_users_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 3: Áreas/Departamentos
-- -------------------------------------------------------
CREATE TABLE areas (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    company_id  CHAR(36)     NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_area_per_company (name, company_id),
    INDEX idx_company_id (company_id),
    CONSTRAINT fk_areas_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 3: Mapeo Área <-> Dataset de Dify
-- -------------------------------------------------------
CREATE TABLE knowledge_bases (
    id              CHAR(36)     NOT NULL DEFAULT (UUID()),
    company_id      CHAR(36)     NOT NULL,
    area_id         CHAR(36)     NOT NULL,
    dify_dataset_id VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dataset_per_area (area_id, dify_dataset_id),
    INDEX idx_company_id (company_id),
    INDEX idx_area_id (area_id),
    INDEX idx_dify_dataset_id (dify_dataset_id),
    CONSTRAINT fk_kb_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_kb_area
        FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 4: Relación N:M Usuario <-> Área
-- -------------------------------------------------------
CREATE TABLE user_areas (
    user_id     CHAR(36)  NOT NULL,
    area_id     CHAR(36)  NOT NULL,
    assigned_by CHAR(36)  NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, area_id),
    INDEX idx_area_id (area_id),
    CONSTRAINT fk_ua_user
        FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_area
        FOREIGN KEY (area_id)     REFERENCES areas(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 6: Sesiones de Chat
-- -------------------------------------------------------
CREATE TABLE chat_sessions (
    id                   CHAR(36)     NOT NULL DEFAULT (UUID()),
    company_id           CHAR(36)     NOT NULL,
    user_id              CHAR(36)     NOT NULL,
    title                VARCHAR(500) NOT NULL DEFAULT 'Nueva conversación',
    dify_conversation_id VARCHAR(255) NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_company_user (company_id, user_id),
    INDEX idx_updated_at  (updated_at),
    CONSTRAINT fk_sessions_company
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -------------------------------------------------------
-- FASE 6: Mensajes de Chat
-- -------------------------------------------------------
CREATE TABLE chat_messages (
    id         CHAR(36)                 NOT NULL DEFAULT (UUID()),
    session_id CHAR(36)                 NOT NULL,
    role       ENUM('user','assistant') NOT NULL,
    content    TEXT                     NOT NULL,
    metadata   JSON                     NULL,
    created_at TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_session_created (session_id, created_at),
    CONSTRAINT fk_messages_session
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;
