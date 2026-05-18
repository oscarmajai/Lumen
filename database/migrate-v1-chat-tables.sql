-- Migration: add chat_sessions and chat_messages tables
-- Run this if the DB was initialised before these tables were added to init.sql.
-- Safe to run multiple times (uses IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS chat_sessions (
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

CREATE TABLE IF NOT EXISTS chat_messages (
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
