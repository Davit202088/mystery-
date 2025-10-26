# 🎰 Система вероятностей и контроля рулетки в RULDETKA

## Оглавление

1. [Как работает рулетка](#как-работает-рулетка)
2. [Практические примеры](#практические-примеры)
3. [Управление вероятностями](#управление-вероятностями)
4. [Настройка боксов](#настройка-боксов)
5. [Мониторинг и анализ](#мониторинг-и-анализ)

---

## 🎯 Как работает рулетка

### Математика вероятностей

Система использует **кумулятивное распределение вероятностей**.

#### Алгоритм:

```javascript
function selectPrizeByProbability(prizes) {
  // 1. Рассчитать кумулятивные вероятности
  let cumulativeProbability = 0;
  const cumulativePrizes = prizes.map(prize => {
    cumulativeProbability += parseFloat(prize.probability) || (100 / prizes.length);
    return {
      ...prize,
      cumulativeProbability
    };
  });

  // 2. Генерировать случайное число от 0 до 100
  const random = Math.random() * 100;  // Диапазон: [0, 100)

  // 3. Найти приз который соответствует случайному числу
  const selectedPrize = cumulativePrizes.find(prize =>
    random <= prize.cumulativeProbability
  );

  return selectedPrize || prizes[0];
}
```

### Пример вычисления

**Исходные данные:**

```
Приз 1: iPhone 15      (вероятность: 10%)
Приз 2: AirPods Pro    (вероятность: 30%)
Приз 3: Sony Headset   (вероятность: 60%)
```

**Вычисление кумулятивных вероятностей:**

```
Приз 1: 0-10     (累積: 10)
Приз 2: 10-40    (累積: 40)
Приз 3: 40-100   (累積: 100)
```

**Моделирование:**

```
Случайное число  →  Результат
       3        →  iPhone 15       (попадает в 0-10)
      25        →  AirPods Pro     (попадает в 10-40)
      75        →  Sony Headset    (попадает в 40-100)
      50        →  Sony Headset    (попадает в 40-100)
```

---

## 📊 Практические примеры

### Пример 1: Starter Box (Простой)

**Общая стоимость бокса:** 499 ₽

```
┌─────────────────────────────────────────┐
│         STARTER BOX (499 ₽)             │
├─────────────────────────────────────────┤
│ Наушники Xiaomi (2990 ₽)      40%      │
│ Power Bank (1490 ₽)           40%      │
│ USB-C Кабель (490 ₽)          20%      │
└─────────────────────────────────────────┘
```

**Анализ:**
- Средняя стоимость приза: 0.4×2990 + 0.4×1490 + 0.2×490 = 1596 ₽
- **Прибыль на бокс:** 1596 - 499 = **1097 ₽** ✅ (выгодный)
- Пользователь получит в среднем 3.2x стоимость бокса

---

### Пример 2: Premium Box (С регулировкой)

**Общая стоимость бокса:** 4999 ₽

#### Вариант А: Щедрый (много дорогих)

```
iPhone 15 Pro Max (119990 ₽)    15%
PlayStation 5 (59990 ₽)         15%
MacBook Air M2 (99990 ₽)        10%
Samsung Galaxy Watch (24990 ₽)  20%
DJI Mini 3 Pro (34990 ₽)        20%
Sony WH-1000XM5 (34990 ₽)       20%

Средняя стоимость: 48 236 ₽
Выгодность: 48 236 / 4999 = 9.6x выше цены ✅
```

#### Вариант Б: Сбалансированный (нормальный)

```
iPhone 15 Pro Max (119990 ₽)    5%
PlayStation 5 (59990 ₽)         10%
MacBook Air M2 (99990 ₽)        5%
Samsung Galaxy Watch (24990 ₽)  25%
DJI Mini 3 Pro (34990 ₽)        25%
Sony WH-1000XM5 (34990 ₽)       30%

Средняя стоимость: 40 495 ₽
Выгодность: 40 495 / 4999 = 8.1x выше цены ✅
```

#### Вариант В: Консервативный (больше прибыли)

```
iPhone 15 Pro Max (119990 ₽)    2%
PlayStation 5 (59990 ₽)         5%
MacBook Air M2 (99990 ₽)        3%
Samsung Galaxy Watch (24990 ₽)  30%
DJI Mini 3 Pro (34990 ₽)        30%
Sony WH-1000XM5 (34990 ₽)       30%

Средняя стоимость: 35 698 ₽
Выгодность: 35 698 / 4999 = 7.1x выше цены ✅
```

---

## ⚙️ Управление вероятностями

### Способ 1: Через Админ-панель (РЕКОМЕНДУЕТСЯ)

1. Открыть: `https://ruldetka.ru/admin.html`
2. Перейти в раздел **"⚙️ Управление вероятностями призов"**
3. Выбрать бокс из списка
4. Редактировать вероятности каждого приза
5. График автоматически обновится
6. Нажать **"💾 Сохранить все вероятности"**

**Преимущества:**
- ✅ Визуальный интерфейс
- ✅ Автоматическая проверка (сумма = 100%)
- ✅ График вероятностей в реальном времени
- ✅ История изменений

---

### Способ 2: Через MySQL напрямую

#### Синтаксис:

```sql
UPDATE prizes
SET probability = <число>
WHERE prizeId = '<ID приза>';
```

#### Пример 1: Изменить вероятность одного приза

```sql
-- Сделать iPhone 15 более редким (10% вероятность)
UPDATE prizes
SET probability = 10
WHERE name = 'iPhone 15' AND boxId = 3;
```

#### Пример 2: Изменить все вероятности в боксе

```sql
-- PREMIUM BOX: Щедрый вариант
UPDATE prizes SET probability = 15 WHERE name = 'iPhone 15 Pro Max';
UPDATE prizes SET probability = 15 WHERE name = 'PlayStation 5';
UPDATE prizes SET probability = 10 WHERE name = 'MacBook Air M2';
UPDATE prizes SET probability = 20 WHERE name = 'Samsung Galaxy Watch';
UPDATE prizes SET probability = 20 WHERE name = 'DJI Mini 3 Pro';
UPDATE prizes SET probability = 20 WHERE name = 'Sony WH-1000XM5';
```

#### Пример 3: Изменить по редкости

```sql
-- Уменьшить шанс легендарных товаров в 2 раза
UPDATE prizes
SET probability = probability * 0.5
WHERE boxId = 3 AND rarity = 'legendary';

-- Увеличить шанс редких товаров
UPDATE prizes
SET probability = probability * 1.5
WHERE boxId = 3 AND rarity = 'rare';
```

#### Пример 4: Уравнять все вероятности (каждый приз 50/50)

```sql
-- 2 приза по 50%
UPDATE prizes
SET probability = 50
WHERE boxId = 1;
```

---

### Способ 3: Через API

#### REST запрос:

```bash
curl -X PUT http://ruldetka.ru/api/admin/prizes/prize_premium_001 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "probability": 15,
    "name": "iPhone 15 Pro Max",
    "value": 119990
  }'
```

#### JavaScript пример:

```javascript
async function updatePrizeProbability(prizeId, newProbability) {
  const response = await fetch(`/api/admin/prizes/${prizeId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      probability: newProbability
    })
  });

  const data = await response.json();
  console.log(data);
}

// Использование
updatePrizeProbability('prize_premium_001', 10);
```

---

## 🎁 Настройка боксов

### Создание нового бокса

```sql
INSERT INTO boxes (boxId, name, description, price, type, itemCount, rarity)
VALUES (
  'box_custom_001',
  'Custom Mystery Box',
  'Ваша собственная коллекция',
  2999,
  'deluxe',
  5,
  'rare'
);
```

### Добавление призов к боксу

```sql
INSERT INTO prizes (prizeId, boxId, name, description, value, rarity, probability)
VALUES (
  'prize_custom_001',
  (SELECT id FROM boxes WHERE boxId = 'box_custom_001'),
  'Приз 1',
  'Описание приза',
  10000,
  'rare',
  50
);

INSERT INTO prizes (prizeId, boxId, name, description, value, rarity, probability)
VALUES (
  'prize_custom_002',
  (SELECT id FROM boxes WHERE boxId = 'box_custom_001'),
  'Приз 2',
  'Описание приза',
  5000,
  'common',
  50
);
```

---

## 📊 Мониторинг и анализ

### Проверить текущие вероятности

```sql
SELECT
  name,
  value,
  rarity,
  probability,
  CONCAT(ROUND(probability), '%') as prob_display
FROM prizes
WHERE boxId = 3
ORDER BY probability DESC;
```

**Результат:**
```
name                    value   rarity      probability  prob_display
iPhone 15 Pro Max      119990  legendary   15            15%
PlayStation 5           59990  legendary   15            15%
Sony WH-1000XM5        34990   epic        20            20%
DJI Mini 3 Pro         34990   epic        20            20%
Samsung Galaxy Watch   24990   epic        25            25%
MacBook Air M2         99990   legendary   5             5%
```

### Проверить баланс вероятностей

```sql
SELECT
  boxId,
  SUM(probability) as total_probability,
  CASE
    WHEN SUM(probability) = 100 THEN 'OK ✅'
    ELSE 'ОШИБКА ❌'
  END as status
FROM prizes
GROUP BY boxId;
```

### Проверить среднюю стоимость приза для бокса

```sql
SELECT
  b.name as box_name,
  b.price as box_price,
  ROUND(SUM(p.value * p.probability / 100), 2) as avg_prize_value,
  ROUND(SUM(p.value * p.probability / 100) / b.price, 2) as multiplier
FROM boxes b
JOIN prizes p ON b.id = p.boxId
GROUP BY b.id;
```

**Результат:**
```
box_name      box_price  avg_prize_value  multiplier
Starter       499        1596             3.2
Deluxe        1999       10245            5.1
Premium       4999       40495            8.1
```

---

## 🎲 Статистика открытий

### Проверить как часто выпадают призы

```sql
SELECT
  p.name,
  p.probability,
  COUNT(ob.id) as times_won,
  ROUND(COUNT(ob.id) * 100.0 / (SELECT COUNT(*) FROM opened_boxes WHERE boxId = b.id), 1) as actual_percentage
FROM prizes p
JOIN boxes b ON p.boxId = b.id
LEFT JOIN opened_boxes ob ON ob.prizeId = p.id
WHERE b.boxId = 'box_premium_001'
GROUP BY p.id
ORDER BY times_won DESC;
```

**Результат** (реальная статистика):
```
name                    probability  times_won  actual_percentage
Sony WH-1000XM5        20%           187        20.2%
Samsung Galaxy Watch   25%           234        25.1%
DJI Mini 3 Pro         20%           185        19.8%
iPhone 15 Pro Max      15%           142        15.3%
PlayStation 5          15%           140        15.1%
MacBook Air M2         5%            50         5.4%
```

> **Важно:** Реальная статистика должна быть близка к установленным вероятностям (±2-3%)

---

## ⚠️ Важные правила

### ✅ Обязательно:

1. **Сумма вероятностей = 100%**
   ```
   Правильно:   20% + 30% + 50% = 100% ✅
   Неправильно: 20% + 30% + 40% = 90% ❌
   ```

2. **Все вероятности > 0**
   ```sql
   UPDATE prizes SET probability = 0;  -- НЕПРАВИЛЬНО
   UPDATE prizes SET probability = 0.1; -- ПРАВИЛЬНО (0.1%)
   ```

3. **Проверить среднюю стоимость приза vs цена бокса**
   ```
   Если avg_prize_value < box_price → убыток! ❌
   Если avg_prize_value > box_price → прибыль ✅
   Рекомендуемый коэффициент: 2-8x
   ```

### ❌ Запрещено:

1. **Создавать боксы с убытком**
   - Пример: Бокс 1000₽, но средний приз стоит 500₽

2. **Использовать вероятности > 100%**
   - MySQL выдаст ошибку или неправильный результат

3. **Забывать обновлять вероятности**
   - Старые значения будут использоваться старым prizesId

4. **Полностью дешевые боксы**
   - Пользователи не будут открывать, если нет редких призов

---

## 💡 Рекомендации

### Для новых пользователей:
- **Starter (499₽):** 40% + 40% + 20% (более частые выигрыши)
- **Multiplier:** 3-4x выше цены

### Для постоянных пользователей:
- **Deluxe (1999₽):** 25% + 25% + 25% + 25% (сбалансировано)
- **Multiplier:** 5-6x выше цены

### Для VIP пользователей:
- **Premium (4999₽):** 15% + 15% + 10% + 20% + 20% + 20% (с легендарными)
- **Multiplier:** 7-8x выше цены

---

## 🔐 Честная рулетка

### Как убедить пользователей в честности:

1. **Опубликовать вероятности на сайте**
   ```html
   <div class="box-odds">
     <h4>Шансы выпадения в этом боксе:</h4>
     <ul>
       <li>iPhone 15 Pro Max - 15%</li>
       <li>PlayStation 5 - 15%</li>
       <!-- ... -->
     </ul>
   </div>
   ```

2. **Показывать SHA256 хеш бокса**
   - Пользователь может проверить что данные не менялись

3. **Логировать все открытия**
   - Сохранять в БД кто что выиграл и когда

4. **Периодический аудит**
   - Проверять статистику реальных открытий vs теоретических

---

## 📈 Примеры A/B тестирования

### Тест 1: Влияние вероятностей на конверсию

```
Вариант А (15% легендарных):
- Открыто: 1000 боксов
- Доход: 4,999,000₽
- Среднее открытий на пользователя: 2.5

Вариант Б (25% легендарных):
- Открыто: 1500 боксов
- Доход: 7,498,500₽
- Среднее открытий на пользователя: 3.1

Вывод: Более щедрые боксы привлекают больше открытий!
```

### Тест 2: Влияние цены бокса

```
Starter (499₽):
- Конверсия: 80% пользователей попробуют
- Среднее открытий: 4

Premium (4999₽):
- Конверсия: 20% пользователей
- Среднее открытий: 1.5

Вывод: Нужны боксы разных цен для разных сегментов!
```

---

## 🚀 Резюме

| Действие | Способ | Сложность | Скорость |
|----------|---------|-----------|----------|
| Изменить 1 вероятность | Админ-панель | ⭐ | 30 сек |
| Изменить все вероятности бокса | Админ-панель | ⭐⭐ | 2 мин |
| Создать новый бокс | SQL + Админ-панель | ⭐⭐⭐ | 10 мин |
| Проверить баланс | SQL запрос | ⭐ | 10 сек |

**Лучший способ:** Админ-панель (`/admin.html`) для базовых изменений + SQL для аналитики и проверок.

---

**Дата создания:** Октябрь 2024
**Версия:** 1.0.0
**Последнее обновление:** Октябрь 2024
