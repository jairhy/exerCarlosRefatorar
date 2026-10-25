-- =====================================================================
-- PixelFix Games - Script do banco de dados db_pixelfix
-- SGBD: MySQL 8.0+ (compatível com MariaDB 10.6+)
-- Dados sensíveis gravados criptografados:
--   senha (bcrypt) | cpf e numeroSerie (AES-256-CBC, chave CRYPTO_KEY do .env.example)
-- Logins de teste: carlos@gmail.com / mariana@gmail.com / rafael@gmail.com  (senha 123456)
-- =====================================================================
SET NAMES utf8mb4;
DROP DATABASE IF EXISTS db_pixelfix;
CREATE DATABASE db_pixelfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_pixelfix;

CREATE TABLE clientes (
  codCliente INT NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  senha      VARCHAR(100) NOT NULL COMMENT 'hash bcrypt',
  cpf        VARCHAR(120) NOT NULL COMMENT 'AES-256-CBC (iv:hex)',
  telefone   VARCHAR(15)  NOT NULL,
  PRIMARY KEY (codCliente),
  UNIQUE KEY uq_clientes_email (email),
  UNIQUE KEY uq_clientes_cpf (cpf)
) ENGINE=InnoDB;

CREATE TABLE consoles (
  codConsole  INT NOT NULL AUTO_INCREMENT,
  modelo      VARCHAR(50)  NOT NULL,
  marca       VARCHAR(50)  NOT NULL,
  numeroSerie VARCHAR(120) NOT NULL COMMENT 'AES-256-CBC (iv:hex)',
  tipoServico VARCHAR(100) NOT NULL,
  codCliente  INT NOT NULL,
  PRIMARY KEY (codConsole),
  UNIQUE KEY uq_consoles_serie (numeroSerie),
  CONSTRAINT fk_consoles_cliente FOREIGN KEY (codCliente)
    REFERENCES clientes (codCliente) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE agendamentos (
  codAgendamento INT NOT NULL AUTO_INCREMENT,
  dataHora       DATETIME NOT NULL,
  codCliente     INT NOT NULL,
  codConsole     INT NOT NULL,
  PRIMARY KEY (codAgendamento),
  KEY idx_agendamentos_dataHora (dataHora),
  CONSTRAINT fk_agend_cliente FOREIGN KEY (codCliente)
    REFERENCES clientes (codCliente) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_agend_console FOREIGN KEY (codConsole)
    REFERENCES consoles (codConsole) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

INSERT INTO clientes (nome, email, senha, cpf, telefone) VALUES
('Carlos Eduardo Silva', 'carlos@gmail.com', '$2a$10$BVceVNZA3Yk.yp7eQeVKIeI80TDxwDJYwpAFzaaPXWYI9dufSlqma', 'cf8de5e188730a48fdf061a16a640e06:8c27df38f310885fc08acfbabb5f29a6', '47991234567'),
('Mariana Souza', 'mariana@gmail.com', '$2a$10$Ssyzf8/qXMdk9OZCGgGa5eANpWTfTA.wwZUX.rAaiwvXDCeDmF.Ai', 'abeb654aff200bf1eb91b0b801635e24:f14bd97666e617734d08927d191a6b52', '47992345678'),
('Rafael Lima', 'rafael@gmail.com', '$2a$10$66DVrx/e3uDzwEfLzCM8HecPKdp.vThXcdNhjEe0cPnp7VzQHqg3K', '04df51c5ddc979dbdee37c1c3feaafad:783e8f04774adf8e099346f6f52af22e', '47993456789');

INSERT INTO consoles (modelo, marca, numeroSerie, tipoServico, codCliente) VALUES
('PlayStation 5', 'Sony', '7c3711fecbf4f44ffc769c8eab598624:e26dc628d3acd3e29de4582ed799c4a5', 'Troca de pasta térmica e limpeza', 1),
('Xbox Series X', 'Microsoft', 'cfd0011b257eeda7ffcd277113de72f3:cfec860398c0014434d7bded354cd330', 'Reparo de leitor de disco', 2),
('Switch OLED', 'Nintendo', 'bbffacf69d109aa3c52bc2ecfa9dccff:298d3be08ad01e92e19102457d3790f1', 'Troca de analógico (drift)', 3),
('PlayStation 4', 'Sony', '5fe6a431cb7e0fd06b70969c7e52423c:598e6f053f32eb40c60fd1676462a021', 'Troca de HDMI', 1);

INSERT INTO agendamentos (dataHora, codCliente, codConsole) VALUES
('2026-11-10 09:00:00', 1, 1),
('2026-11-10 14:30:00', 2, 2),
('2026-11-11 10:00:00', 3, 3),
('2026-11-12 16:00:00', 1, 4);

-- Conferência
SELECT * FROM clientes;
SELECT * FROM consoles;
SELECT a.codAgendamento, a.dataHora, c.nome, o.modelo FROM agendamentos a
  JOIN clientes c ON c.codCliente = a.codCliente JOIN consoles o ON o.codConsole = a.codConsole
  ORDER BY a.dataHora;
