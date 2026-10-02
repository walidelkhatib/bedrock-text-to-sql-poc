-- Sample data for Sales Database

-- Insert customers
INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code) VALUES
('John', 'Smith', 'john.smith@email.com', '555-0101', '123 Main St', 'New York', 'NY', '10001'),
('Sarah', 'Johnson', 'sarah.j@email.com', '555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001'),
('Michael', 'Williams', 'mwilliams@email.com', '555-0103', '789 Pine Rd', 'Chicago', 'IL', '60601'),
('Emily', 'Brown', 'ebrown@email.com', '555-0104', '321 Elm St', 'Houston', 'TX', '77001'),
('David', 'Jones', 'djones@email.com', '555-0105', '654 Maple Dr', 'Phoenix', 'AZ', '85001'),
('Jessica', 'Garcia', 'jgarcia@email.com', '555-0106', '987 Cedar Ln', 'Philadelphia', 'PA', '19019'),
('James', 'Martinez', 'jmartinez@email.com', '555-0107', '147 Birch Way', 'San Antonio', 'TX', '78201'),
('Lisa', 'Rodriguez', 'lrodriguez@email.com', '555-0108', '258 Spruce Ct', 'San Diego', 'CA', '92101'),
('Robert', 'Wilson', 'rwilson@email.com', '555-0109', '369 Ash Blvd', 'Dallas', 'TX', '75201'),
('Jennifer', 'Anderson', 'janderson@email.com', '555-0110', '741 Willow Pl', 'San Jose', 'CA', '95101');

-- Insert products
INSERT INTO products (product_name, category, price, cost, stock_quantity, description) VALUES
('Laptop Pro 15', 'Electronics', 1299.99, 899.99, 50, 'High-performance laptop with 15-inch display'),
('Wireless Mouse', 'Electronics', 29.99, 15.99, 200, 'Ergonomic wireless mouse'),
('USB-C Cable', 'Electronics', 19.99, 8.99, 500, 'Fast charging USB-C cable'),
('Office Chair', 'Furniture', 249.99, 149.99, 75, 'Ergonomic office chair with lumbar support'),
('Standing Desk', 'Furniture', 599.99, 399.99, 30, 'Adjustable height standing desk'),
('Desk Lamp', 'Furniture', 49.99, 24.99, 150, 'LED desk lamp with adjustable brightness'),
('Notebook Set', 'Office Supplies', 12.99, 5.99, 300, 'Set of 3 premium notebooks'),
('Pen Pack', 'Office Supplies', 8.99, 3.99, 400, 'Pack of 12 ballpoint pens'),
('Backpack', 'Accessories', 79.99, 39.99, 100, 'Durable laptop backpack'),
('Water Bottle', 'Accessories', 24.99, 12.99, 250, 'Insulated stainless steel water bottle');

-- Insert orders and order items
INSERT INTO orders (customer_id, order_date, status, total_amount, shipping_address, shipping_city, shipping_state, shipping_zip) VALUES
(1, '2024-01-15 10:30:00', 'completed', 1349.97, '123 Main St', 'New York', 'NY', '10001'),
(2, '2024-01-16 14:20:00', 'completed', 329.97, '456 Oak Ave', 'Los Angeles', 'CA', '90001'),
(3, '2024-01-17 09:15:00', 'completed', 849.97, '789 Pine Rd', 'Chicago', 'IL', '60601'),
(4, '2024-01-18 16:45:00', 'shipped', 279.98, '321 Elm St', 'Houston', 'TX', '77001'),
(5, '2024-01-19 11:30:00', 'completed', 1899.96, '654 Maple Dr', 'Phoenix', 'AZ', '85001'),
(1, '2024-01-20 13:00:00', 'completed', 62.97, '123 Main St', 'New York', 'NY', '10001'),
(6, '2024-01-21 10:00:00', 'processing', 649.98, '987 Cedar Ln', 'Philadelphia', 'PA', '19019'),
(7, '2024-01-22 15:30:00', 'completed', 104.97, '147 Birch Way', 'San Antonio', 'TX', '78201'),
(8, '2024-01-23 12:15:00', 'completed', 1329.98, '258 Spruce Ct', 'San Diego', 'CA', '92101'),
(9, '2024-01-24 09:45:00', 'shipped', 299.97, '369 Ash Blvd', 'Dallas', 'TX', '75201');

-- Order 1 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 2, 1, 29.99, 29.99),
(1, 3, 1, 19.99, 19.99);

-- Order 2 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(2, 4, 1, 249.99, 249.99),
(2, 9, 1, 79.99, 79.99);

-- Order 3 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(3, 5, 1, 599.99, 599.99),
(3, 4, 1, 249.99, 249.99);

-- Order 4 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(4, 4, 1, 249.99, 249.99),
(4, 2, 1, 29.99, 29.99);

-- Order 5 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(5, 1, 1, 1299.99, 1299.99),
(5, 5, 1, 599.99, 599.99);

-- Order 6 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(6, 7, 2, 12.99, 25.98),
(6, 8, 3, 8.99, 26.97),
(6, 10, 1, 24.99, 24.99);

-- Order 7 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(7, 5, 1, 599.99, 599.99),
(7, 6, 1, 49.99, 49.99);

-- Order 8 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(8, 9, 1, 79.99, 79.99),
(8, 10, 1, 24.99, 24.99);

-- Order 9 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(9, 1, 1, 1299.99, 1299.99),
(9, 2, 1, 29.99, 29.99);

-- Order 10 items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
(10, 4, 1, 249.99, 249.99),
(10, 6, 1, 49.99, 49.99);
