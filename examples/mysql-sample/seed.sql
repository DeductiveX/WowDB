-- ──────────────────────────────────────────────────────────────────────
--  WowDB · Demo Dataset · Seed Data
--  All data is 100% FICTITIOUS. No real personal data.
-- ──────────────────────────────────────────────────────────────────────

USE creditdb;

-- ── status_contrato ───────────────────────────────────────────────────
INSERT INTO status_contrato (codigo, descricao) VALUES
  ('ativo',       'Contrato ativo em dia'),
  ('atrasado',    'Contrato com parcelas em atraso'),
  ('quitado',     'Contrato totalmente quitado'),
  ('cancelado',   'Contrato cancelado'),
  ('renegociado', 'Contrato renegociado');

-- ── produtos_credito ──────────────────────────────────────────────────
INSERT INTO produtos_credito (codigo, nome, taxa_juros_mensal, prazo_min_meses, prazo_max_meses, valor_min, valor_max) VALUES
  ('CDC-PES', 'Crédito Pessoal',          0.0199, 6,  48, 1000.00,  30000.00),
  ('CDC-CON', 'Crédito Consignado',       0.0089, 12, 84, 500.00,   50000.00),
  ('CDC-VEI', 'Financiamento de Veículo', 0.0149, 24, 60, 5000.00, 120000.00),
  ('CDC-EME', 'Crédito Emergencial',      0.0299, 3,  12, 200.00,   5000.00),
  ('CDC-REF', 'Refinanciamento',          0.0179, 6,  36, 1000.00,  20000.00);

-- ── clientes ──────────────────────────────────────────────────────────
INSERT INTO clientes (nome, email, telefone, cidade, estado, score_interno) VALUES
  ('Aldo Ferreira Nunes',      'aldo.nunes@mailtest.fake',     '(11) 91234-0001', 'São Paulo',       'SP', 780),
  ('Beatriz Carvalho Lima',    'beatriz.lima@mailtest.fake',   '(21) 91234-0002', 'Rio de Janeiro',  'RJ', 650),
  ('Carlos Moreira Santos',    'carlos.santos@mailtest.fake',  '(31) 91234-0003', 'Belo Horizonte',  'MG', 820),
  ('Diana Costa Pereira',      'diana.pereira@mailtest.fake',  '(41) 91234-0004', 'Curitiba',        'PR', 590),
  ('Eduardo Alves Rodrigues',  'eduardo.rod@mailtest.fake',    '(51) 91234-0005', 'Porto Alegre',    'RS', 710),
  ('Fernanda Oliveira Cruz',   'fernanda.cruz@mailtest.fake',  '(61) 91234-0006', 'Brasília',        'DF', 870),
  ('Gabriel Souza Martins',    'gabriel.martins@mailtest.fake','(71) 91234-0007', 'Salvador',        'BA', 430),
  ('Helena Barbosa Gomes',     'helena.gomes@mailtest.fake',   '(81) 91234-0008', 'Recife',          'PE', 760),
  ('Igor Nascimento Araujo',   'igor.araujo@mailtest.fake',    '(85) 91234-0009', 'Fortaleza',       'CE', 540),
  ('Julia Mendes Pinto',       'julia.pinto@mailtest.fake',    '(92) 91234-0010', 'Manaus',          'AM', 690),
  ('Kevin Rocha Teixeira',     'kevin.teixeira@mailtest.fake', '(62) 91234-0011', 'Goiânia',         'GO', 810),
  ('Larissa Campos Vieira',    'larissa.vieira@mailtest.fake', '(65) 91234-0012', 'Cuiabá',          'MT', 620),
  ('Marcos Lopes Fernandez',   'marcos.fern@mailtest.fake',    '(67) 91234-0013', 'Campo Grande',    'MS', 740),
  ('Natalia Dias Correia',     'natalia.corr@mailtest.fake',   '(91) 91234-0014', 'Belém',           'PA', 480),
  ('Otávio Ribeiro Andrade',   'otavio.and@mailtest.fake',     '(98) 91234-0015', 'São Luís',        'MA', 560),
  ('Patricia Melo Cardoso',    'patricia.card@mailtest.fake',  '(83) 91234-0016', 'João Pessoa',     'PB', 830),
  ('Rafael Nunes Batista',     'rafael.bat@mailtest.fake',     '(84) 91234-0017', 'Natal',           'RN', 670),
  ('Sabrina Torres Azevedo',   'sabrina.az@mailtest.fake',     '(82) 91234-0018', 'Maceió',          'AL', 720),
  ('Thiago Faria Cavalcante',  'thiago.cav@mailtest.fake',     '(79) 91234-0019', 'Aracaju',         'SE', 580),
  ('Ursula Peixoto Macedo',    'ursula.mac@mailtest.fake',     '(27) 91234-0020', 'Vitória',         'ES', 790);

-- ── contratos ─────────────────────────────────────────────────────────
INSERT INTO contratos (cliente_id, produto_id, status_id, numero, valor_total, valor_parcela, num_parcelas, taxa_juros_aplicada, data_inicio, data_vencimento) VALUES
  (1,  1, 1, 'CTR-2024-000001', 12000.00, 666.67,  18, 0.0199, '2024-01-15', '2025-07-15'),
  (2,  2, 1, 'CTR-2024-000002', 25000.00, 416.67,  60, 0.0089, '2024-02-01', '2029-02-01'),
  (3,  3, 3, 'CTR-2023-000003', 45000.00, 937.50,  48, 0.0149, '2023-03-10', '2027-03-10'),
  (4,  4, 2, 'CTR-2024-000004',  3000.00, 300.00,  10, 0.0299, '2024-03-20', '2025-01-20'),
  (5,  1, 1, 'CTR-2024-000005',  8000.00, 444.44,  18, 0.0199, '2024-04-05', '2025-10-05'),
  (6,  2, 1, 'CTR-2024-000006', 50000.00, 714.29,  70, 0.0089, '2024-04-15', '2030-02-15'),
  (7,  5, 2, 'CTR-2024-000007',  5000.00, 277.78,  18, 0.0179, '2024-05-01', '2025-11-01'),
  (8,  1, 1, 'CTR-2024-000008', 15000.00, 625.00,  24, 0.0199, '2024-05-20', '2026-05-20'),
  (9,  4, 4, 'CTR-2024-000009',  2000.00, 333.33,   6, 0.0299, '2024-06-01', '2024-12-01'),
  (10, 2, 1, 'CTR-2024-000010', 30000.00, 500.00,  60, 0.0089, '2024-06-10', '2029-06-10'),
  (11, 3, 1, 'CTR-2024-000011', 80000.00, 1600.00, 50, 0.0149, '2024-07-01', '2028-09-01'),
  (12, 1, 2, 'CTR-2024-000012',  6000.00, 500.00,  12, 0.0199, '2024-07-15', '2025-07-15'),
  (13, 5, 1, 'CTR-2024-000013', 18000.00, 750.00,  24, 0.0179, '2024-08-01', '2026-08-01'),
  (14, 4, 3, 'CTR-2023-000014',  1500.00, 250.00,   6, 0.0299, '2023-09-01', '2024-03-01'),
  (15, 2, 1, 'CTR-2024-000015', 20000.00, 380.95,  52, 0.0089, '2024-09-10', '2029-01-10'),
  (16, 1, 1, 'CTR-2024-000016', 10000.00, 555.56,  18, 0.0199, '2024-10-01', '2026-04-01'),
  (17, 3, 1, 'CTR-2024-000017', 60000.00, 1250.00, 48, 0.0149, '2024-10-15', '2028-10-15'),
  (18, 5, 2, 'CTR-2024-000018',  8000.00, 444.44,  18, 0.0179, '2024-11-01', '2026-05-01'),
  (19, 4, 1, 'CTR-2024-000019',  4000.00, 400.00,  10, 0.0299, '2024-11-20', '2025-09-20'),
  (20, 2, 1, 'CTR-2024-000020', 35000.00, 583.33,  60, 0.0089, '2024-12-01', '2029-12-01');

-- ── parcelas (first 3 installments per contract) ──────────────────────
INSERT INTO parcelas (contrato_id, numero_parcela, valor, data_vencimento, data_pagamento, valor_pago, status) VALUES
  (1, 1, 666.67, '2024-02-15', '2024-02-14', 666.67, 'paga'),
  (1, 2, 666.67, '2024-03-15', '2024-03-15', 666.67, 'paga'),
  (1, 3, 666.67, '2024-04-15', '2024-04-13', 666.67, 'paga'),
  (1, 4, 666.67, '2024-05-15', NULL, NULL, 'pendente'),
  (2, 1, 416.67, '2024-03-01', '2024-03-01', 416.67, 'paga'),
  (2, 2, 416.67, '2024-04-01', '2024-04-02', 416.67, 'paga'),
  (2, 3, 416.67, '2024-05-01', NULL, NULL, 'pendente'),
  (3, 1, 937.50, '2023-04-10', '2023-04-09', 937.50, 'paga'),
  (3, 2, 937.50, '2023-05-10', '2023-05-10', 937.50, 'paga'),
  (3, 3, 937.50, '2023-06-10', '2023-06-11', 937.50, 'paga'),
  (4, 1, 300.00, '2024-04-20', '2024-04-20', 300.00, 'paga'),
  (4, 2, 300.00, '2024-05-20', NULL, NULL, 'atrasada'),
  (4, 3, 300.00, '2024-06-20', NULL, NULL, 'atrasada'),
  (5, 1, 444.44, '2024-05-05', '2024-05-05', 444.44, 'paga'),
  (5, 2, 444.44, '2024-06-05', '2024-06-04', 444.44, 'paga'),
  (5, 3, 444.44, '2024-07-05', NULL, NULL, 'pendente'),
  (6, 1, 714.29, '2024-05-15', '2024-05-15', 714.29, 'paga'),
  (6, 2, 714.29, '2024-06-15', '2024-06-16', 714.29, 'paga'),
  (6, 3, 714.29, '2024-07-15', NULL, NULL, 'pendente'),
  (7, 1, 277.78, '2024-06-01', NULL, NULL, 'atrasada');

-- ── pagamentos ────────────────────────────────────────────────────────
INSERT INTO pagamentos (parcela_id, valor_pago, data_pagamento, canal, referencia) VALUES
  (1,  666.67, '2024-02-14 10:23:00', 'pix',    'PIX20240214-00001'),
  (2,  666.67, '2024-03-15 09:15:00', 'pix',    'PIX20240315-00002'),
  (3,  666.67, '2024-04-13 14:30:00', 'boleto', 'BOL20240413-00003'),
  (5,  416.67, '2024-03-01 11:00:00', 'pix',    'PIX20240301-00004'),
  (6,  416.67, '2024-04-02 16:45:00', 'ted',    'TED20240402-00005'),
  (8,  937.50, '2023-04-09 08:00:00', 'boleto', 'BOL20230409-00006'),
  (9,  937.50, '2023-05-10 12:30:00', 'pix',    'PIX20230510-00007'),
  (10, 937.50, '2023-06-11 09:55:00', 'pix',    'PIX20230611-00008'),
  (11, 300.00, '2024-04-20 15:00:00', 'cartao', 'CRT20240420-00009'),
  (14, 444.44, '2024-05-05 10:10:00', 'pix',    'PIX20240505-00010'),
  (15, 444.44, '2024-06-04 11:20:00', 'pix',    'PIX20240604-00011'),
  (17, 714.29, '2024-05-15 09:00:00', 'pix',    'PIX20240515-00012'),
  (18, 714.29, '2024-06-16 14:00:00', 'boleto', 'BOL20240616-00013');
