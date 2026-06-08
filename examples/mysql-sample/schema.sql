-- ──────────────────────────────────────────────────────────────────────
--  WowDB · Demo Dataset · Credit Management Schema
--  All data is 100% FICTITIOUS. No real personal data.
-- ──────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS creditdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE creditdb;

-- ── status_contrato ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_contrato (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo      VARCHAR(30)      NOT NULL UNIQUE,
  descricao   VARCHAR(100)     NOT NULL,
  ativo       TINYINT(1)       NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  INDEX idx_codigo (codigo)
) ENGINE=InnoDB COMMENT='Lookup table for contract statuses';

-- ── produtos_credito ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos_credito (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)  NOT NULL UNIQUE,
  nome                VARCHAR(100) NOT NULL,
  taxa_juros_mensal   DECIMAL(5,4) NOT NULL COMMENT 'Monthly interest rate, e.g. 0.0199 = 1.99%',
  prazo_min_meses     TINYINT UNSIGNED NOT NULL DEFAULT 1,
  prazo_max_meses     TINYINT UNSIGNED NOT NULL DEFAULT 60,
  valor_min           DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  valor_max           DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
  ativo               TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_codigo (codigo),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB COMMENT='Credit product catalog';

-- ── clientes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(120)  NOT NULL,
  email           VARCHAR(180)  NOT NULL UNIQUE,
  telefone        VARCHAR(20)   NULL,
  cidade          VARCHAR(80)   NOT NULL,
  estado          CHAR(2)       NOT NULL,
  score_interno   SMALLINT      NOT NULL DEFAULT 0 COMMENT 'Internal credit score 0-1000',
  ativo           TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_estado (estado),
  INDEX idx_score (score_interno),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB COMMENT='Customer records - all data is fictitious';

-- ── contratos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contratos (
  id                  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  cliente_id          INT UNSIGNED  NOT NULL,
  produto_id          INT UNSIGNED  NOT NULL,
  status_id           TINYINT UNSIGNED NOT NULL,
  numero              VARCHAR(30)   NOT NULL UNIQUE,
  valor_total         DECIMAL(12,2) NOT NULL,
  valor_parcela       DECIMAL(10,2) NOT NULL,
  num_parcelas        TINYINT UNSIGNED NOT NULL,
  taxa_juros_aplicada DECIMAL(5,4)  NOT NULL,
  data_inicio         DATE          NOT NULL,
  data_vencimento     DATE          NOT NULL,
  data_quitacao       DATE          NULL,
  created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE INDEX idx_numero (numero),
  INDEX idx_cliente (cliente_id),
  INDEX idx_produto (produto_id),
  INDEX idx_status (status_id),
  INDEX idx_data_inicio (data_inicio),
  INDEX idx_data_vencimento (data_vencimento),
  CONSTRAINT fk_contrato_cliente  FOREIGN KEY (cliente_id) REFERENCES clientes (id),
  CONSTRAINT fk_contrato_produto  FOREIGN KEY (produto_id) REFERENCES produtos_credito (id),
  CONSTRAINT fk_contrato_status   FOREIGN KEY (status_id)  REFERENCES status_contrato (id)
) ENGINE=InnoDB COMMENT='Credit contracts';

-- ── parcelas ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parcelas (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  contrato_id     INT UNSIGNED  NOT NULL,
  numero_parcela  TINYINT UNSIGNED NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  data_vencimento DATE          NOT NULL,
  data_pagamento  DATE          NULL,
  valor_pago      DECIMAL(10,2) NULL,
  status          ENUM('pendente','paga','atrasada','cancelada') NOT NULL DEFAULT 'pendente',
  PRIMARY KEY (id),
  UNIQUE INDEX idx_contrato_parcela (contrato_id, numero_parcela),
  INDEX idx_contrato (contrato_id),
  INDEX idx_vencimento (data_vencimento),
  INDEX idx_status (status),
  CONSTRAINT fk_parcela_contrato FOREIGN KEY (contrato_id) REFERENCES contratos (id)
) ENGINE=InnoDB COMMENT='Contract installments';

-- ── pagamentos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagamentos (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  parcela_id      INT UNSIGNED  NOT NULL,
  valor_pago      DECIMAL(10,2) NOT NULL,
  data_pagamento  DATETIME      NOT NULL,
  canal           ENUM('pix','boleto','cartao','ted','dinheiro') NOT NULL DEFAULT 'pix',
  referencia      VARCHAR(80)   NULL COMMENT 'External payment reference/transaction ID',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_parcela (parcela_id),
  INDEX idx_data (data_pagamento),
  INDEX idx_canal (canal),
  CONSTRAINT fk_pagamento_parcela FOREIGN KEY (parcela_id) REFERENCES parcelas (id)
) ENGINE=InnoDB COMMENT='Payment records';

-- ── demo read-only user (for WowDB recommended setup) ─────────────────
CREATE USER IF NOT EXISTS 'wowdb_reader'@'%' IDENTIFIED BY 'readonly_pass123';
GRANT SELECT, SHOW VIEW ON creditdb.* TO 'wowdb_reader'@'%';
FLUSH PRIVILEGES;
