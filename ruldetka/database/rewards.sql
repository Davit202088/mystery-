-- ========================
-- СИСТЕМА НАГРАД И ВОЗНАГРАЖДЕНИЙ
-- ========================

-- Таблица видов наград
CREATE TABLE IF NOT EXISTS rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rewardId VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('review', 'referral', 'daily', 'action', 'bonus') DEFAULT 'action',
  coins INT NOT NULL,
  image VARCHAR(255),
  isActive BOOLEAN DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(rewardId),
  INDEX(type)
);

-- Таблица полученных наград пользователями
CREATE TABLE IF NOT EXISTS user_rewards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  claimedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id),
  FOREIGN KEY(rewardId) REFERENCES rewards(id),
  UNIQUE KEY unique_user_reward (userId, rewardId),
  INDEX(userId),
  INDEX(rewardId),
  INDEX(claimedAt)
);

-- Таблица логов наград
CREATE TABLE IF NOT EXISTS reward_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rewardId INT NOT NULL,
  action VARCHAR(50),
  amount INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id),
  FOREIGN KEY(rewardId) REFERENCES rewards(id),
  INDEX(userId),
  INDEX(timestamp)
);

-- Таблица ручной выдачи монет админом
CREATE TABLE IF NOT EXISTS admin_grants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId VARCHAR(255) NOT NULL,
  targetUserId VARCHAR(255) NOT NULL,
  coins INT NOT NULL,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(adminId) REFERENCES users(userId),
  FOREIGN KEY(targetUserId) REFERENCES users(userId),
  INDEX(adminId),
  INDEX(targetUserId),
  INDEX(timestamp)
);

-- Таблица реферальной программы
CREATE TABLE IF NOT EXISTS referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrerId INT NOT NULL,
  referredUserId INT NOT NULL,
  bonusCoins INT DEFAULT 100,
  status ENUM('pending', 'completed') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP NULL,
  FOREIGN KEY(referrerId) REFERENCES users(id),
  FOREIGN KEY(referredUserId) REFERENCES users(id),
  INDEX(referrerId),
  INDEX(referredUserId),
  INDEX(status)
);

-- Таблица отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  rating INT DEFAULT 5,
  text TEXT,
  rewardCoins INT DEFAULT 50,
  isApproved BOOLEAN DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id),
  INDEX(userId),
  INDEX(isApproved)
);

-- ========================
-- ПРИМЕРЫ НАГРАД
-- ========================

INSERT INTO rewards (rewardId, name, description, type, coins, image) VALUES
('reward_review_001', 'За отзыв', 'Оставьте отзыв о боксе и получите 50 монет', 'review', 50, 'https://via.placeholder.com/100x100?text=Review'),
('reward_ref_001', 'За приглашение друга', 'Пригласите друга и получите 100 монет', 'referral', 100, 'https://via.placeholder.com/100x100?text=Referral'),
('reward_daily_001', 'Ежедневный бонус', 'Заходите каждый день и получайте 10 монет', 'daily', 10, 'https://via.placeholder.com/100x100?text=Daily'),
('reward_ref_friend_002', 'Друг присоединился', 'Приглашенный друг сделал первую покупку - вы получили 50 монет', 'referral', 50, 'https://via.placeholder.com/100x100?text=Referral+Friend'),
('reward_first_box_001', 'Первый открытый бокс', 'Откройте первый бокс - получите 25 монет', 'action', 25, 'https://via.placeholder.com/100x100?text=First+Box'),
('reward_5_boxes_001', '5 открытых боксов', 'Откройте 5 боксов - получите 100 монет', 'action', 100, 'https://via.placeholder.com/100x100?text=5+Boxes'),
('reward_lucky_001', 'Везенье!', 'Выиграйте призу стоимостью в 10x цена бокса - получите 500 монет', 'bonus', 500, 'https://via.placeholder.com/100x100?text=Lucky');
