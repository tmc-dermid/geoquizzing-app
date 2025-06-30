
-- Window Functions

BEGIN;
CREATE TABLE IF NOT EXISTS orders (
    order_id INT PRIMARY KEY,
    order_date DATE,
    order_total INT
);

INSERT INTO orders
VALUES
(1, '2020-04-03', 100),
(2, '2020-04-03', 250),
(3, '2020-04-04', 80),
(4, '2020-04-04', 110),
(5, '2020-04-04', 195),
(6, '2020-04-05', 220),
(7, '2020-04-05', 40);
COMMIT;

SELECT *
FROM orders;

DROP TABLE orders;

SELECT order_id, order_date, order_total,
    SUM(order_total) OVER(
        PARTITION BY order_date
        ORDER BY order_id ASC
    ) AS running_total
FROM orders
ORDER BY order_date ASC;
