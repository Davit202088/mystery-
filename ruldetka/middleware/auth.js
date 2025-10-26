const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    // Получить токен из заголовка
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const token = authHeader.substring(7); // Убрать "Bearer " из начала

    // Проверить токен
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret_key'
    );

    // Сохранить данные пользователя в request
    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Неверный токен' });
    }
    return res.status(401).json({ error: 'Ошибка аутентификации' });
  }
}

function verifyAdmin(req, res, next) {
  // Сначала проверить токен
  verifyToken(req, res, () => {
    // Затем проверить что пользователь админ
    // (в реальном приложении нужно проверить БД)
    if (req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
    }
  });
}

module.exports = {
  verifyToken,
  verifyAdmin
};
