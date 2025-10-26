-- ========================
-- ПРИМЕРЫ ДАННЫХ (SEED)
-- ========================

-- Вставить примеры боксов
INSERT INTO boxes (boxId, name, description, price, type, itemCount, image, rarity, isActive) VALUES
('box_starter_001', 'Starter Box', 'Идеальный первый бокс для новичков', 499, 'starter', 3, 'https://via.placeholder.com/300x300?text=Starter+Box', 'common', 1),
('box_deluxe_001', 'Deluxe Box', 'Премиум набор с гарантированным редким призом', 1999, 'deluxe', 5, 'https://via.placeholder.com/300x300?text=Deluxe+Box', 'rare', 1),
('box_premium_001', 'Premium Box', 'Легендарные призы ждут вас', 4999, 'premium', 10, 'https://via.placeholder.com/300x300?text=Premium+Box', 'legendary', 1);

-- Вставить примеры призов для Starter Box
INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive) VALUES
('prize_starter_001', 1, 'Наушники Xiaomi', 'Беспроводные наушники Xiaomi', 'https://via.placeholder.com/100x100?text=Earbuds', 2990, 'common', 40, 1),
('prize_starter_002', 1, 'Power Bank 10000mAh', 'Мобильное зарядное устройство', 'https://via.placeholder.com/100x100?text=PowerBank', 1490, 'common', 40, 1),
('prize_starter_003', 1, 'USB-C Кабель', 'Качественный кабель для заряда', 'https://via.placeholder.com/100x100?text=Cable', 490, 'common', 20, 1);

-- Вставить примеры призов для Deluxe Box
INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive) VALUES
('prize_deluxe_001', 2, 'iPhone 13', 'Смартфон Apple iPhone 13', 'https://via.placeholder.com/100x100?text=iPhone13', 54990, 'epic', 25, 1),
('prize_deluxe_002', 2, 'iPad Air', 'Планшет Apple iPad Air', 'https://via.placeholder.com/100x100?text=iPad', 49990, 'epic', 25, 1),
('prize_deluxe_003', 2, 'Apple Watch', 'Умные часы Apple Watch Series 7', 'https://via.placeholder.com/100x100?text=Watch', 39990, 'rare', 25, 1),
('prize_deluxe_004', 2, 'AirPods Pro', 'Премиум наушники Apple AirPods Pro', 'https://via.placeholder.com/100x100?text=AirPods', 24990, 'rare', 25, 1);

-- Вставить примеры призов для Premium Box
INSERT INTO prizes (prizeId, boxId, name, description, image, value, rarity, probability, isActive) VALUES
('prize_premium_001', 3, 'iPhone 15 Pro Max', 'Флагманский смартфон Apple', 'https://via.placeholder.com/100x100?text=iPhone15Pro', 119990, 'legendary', 15, 1),
('prize_premium_002', 3, 'PlayStation 5', 'Консоль Sony PlayStation 5', 'https://via.placeholder.com/100x100?text=PS5', 59990, 'legendary', 15, 1),
('prize_premium_003', 3, 'MacBook Air M2', 'Ноутбук Apple MacBook Air', 'https://via.placeholder.com/100x100?text=MacBook', 99990, 'legendary', 10, 1),
('prize_premium_004', 3, 'Samsung Galaxy Watch', 'Смарт-часы Samsung Galaxy Watch 5', 'https://via.placeholder.com/100x100?text=GalaxyWatch', 24990, 'epic', 20, 1),
('prize_premium_005', 3, 'DJI Mini 3 Pro', 'Дрон DJI Mini 3 Pro', 'https://via.placeholder.com/100x100?text=DJIMini', 34990, 'epic', 20, 1),
('prize_premium_006', 3, 'Sony WH-1000XM5', 'Премиум наушники Sony', 'https://via.placeholder.com/100x100?text=SonyWH', 34990, 'rare', 20, 1);

-- ========================
-- ПРИМЕРЫ ПОЛЬЗОВАТЕЛЕЙ (для тестирования)
-- ========================

INSERT INTO users (userId, email, username, passwordHash, firstName, lastName, role, balance, createdAt) VALUES
('user_test_001', 'test@example.com', 'testuser', '$2a$10$YJC/EwlIX0v8ZCJsSuXRWOp4aDfQWrJaWyZCDH0rLiPB1zPMsCpYK', 'Test', 'User', 'user', 5000, NOW()),
('user_admin_001', 'admin@example.com', 'admin', '$2a$10$YJC/EwlIX0v8ZCJsSuXRWOp4aDfQWrJaWyZCDH0rLiPB1zPMsCpYK', 'Admin', 'User', 'admin', 10000, NOW());

-- ========================
-- ПРИМЕРЫ ОТКРЫТИЙ БОКСОВ
-- ========================

INSERT INTO opened_boxes (userId, boxId, prizeId, amount, transactionId, status, createdAt) VALUES
(1, 1, 1, 499, 'txn_001', 'success', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(1, 2, 3, 1999, 'txn_002', 'success', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(1, 3, 4, 4999, 'txn_003', 'success', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- ========================
-- ПРИМЕРЫ ТРАНЗАКЦИЙ
-- ========================

INSERT INTO transactions (transactionId, userId, type, amount, paymentMethod, paymentGateway, status, createdAt, completedAt) VALUES
('pay_test_001', 1, 'deposit', 500, 'bank_card', 'yookassa', 'completed', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('pay_test_002', 1, 'deposit', 1000, 'bank_card', 'yookassa', 'completed', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR));

-- ========================
-- ПРИМЕЧАНИЯ
-- ========================

-- Пароль для тестовых пользователей: 'password123'
-- Email: test@example.com
-- Email admin: admin@example.com
--
-- Для создания своих паролей используйте bcryptjs:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_password', 10);
