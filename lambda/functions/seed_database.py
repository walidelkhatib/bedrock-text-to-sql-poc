import json
import os
import boto3
import psycopg2
from botocore.exceptions import ClientError

def handler(event, context):
    """Lambda function to seed the database"""
    
    # Get database credentials from Secrets Manager
    secret_arn = os.environ['DB_SECRET_ARN']
    db_name = os.environ['DB_NAME']
    
    secrets_client = boto3.client('secretsmanager')
    
    try:
        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(secret_response['SecretString'])
        
        # Connect to database
        conn = psycopg2.connect(
            host=secret['host'],
            port=secret['port'],
            database=db_name,
            user=secret['username'],
            password=secret['password']
        )
        
        cursor = conn.cursor()
        
        # Create schema
        schema_sql = """
        -- Customers table
        CREATE TABLE IF NOT EXISTS customers (
            customer_id SERIAL PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            phone VARCHAR(20),
            address VARCHAR(200),
            city VARCHAR(50),
            state VARCHAR(2),
            zip_code VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Products table
        CREATE TABLE IF NOT EXISTS products (
            product_id SERIAL PRIMARY KEY,
            product_name VARCHAR(100) NOT NULL,
            category VARCHAR(50),
            price DECIMAL(10, 2) NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Orders table
        CREATE TABLE IF NOT EXISTS orders (
            order_id SERIAL PRIMARY KEY,
            customer_id INTEGER REFERENCES customers(customer_id),
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount DECIMAL(10, 2),
            status VARCHAR(20) DEFAULT 'pending',
            shipping_address VARCHAR(200),
            shipping_city VARCHAR(50),
            shipping_state VARCHAR(2),
            shipping_zip VARCHAR(10)
        );

        -- Order items table
        CREATE TABLE IF NOT EXISTS order_items (
            order_item_id SERIAL PRIMARY KEY,
            order_id INTEGER REFERENCES orders(order_id),
            product_id INTEGER REFERENCES products(product_id),
            quantity INTEGER NOT NULL,
            unit_price DECIMAL(10, 2) NOT NULL,
            subtotal DECIMAL(10, 2) NOT NULL
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
        CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
        """
        
        cursor.execute(schema_sql)
        
        # Insert sample data
        sample_data_sql = """
        -- Insert customers
        INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code) VALUES
        ('John', 'Doe', 'john.doe@email.com', '555-0101', '123 Main St', 'San Francisco', 'CA', '94102'),
        ('Jane', 'Smith', 'jane.smith@email.com', '555-0102', '456 Oak Ave', 'Los Angeles', 'CA', '90001'),
        ('Bob', 'Johnson', 'bob.johnson@email.com', '555-0103', '789 Pine Rd', 'Seattle', 'WA', '98101'),
        ('Alice', 'Williams', 'alice.williams@email.com', '555-0104', '321 Elm St', 'Portland', 'OR', '97201'),
        ('Charlie', 'Brown', 'charlie.brown@email.com', '555-0105', '654 Maple Dr', 'Austin', 'TX', '78701'),
        ('Diana', 'Davis', 'diana.davis@email.com', '555-0106', '987 Cedar Ln', 'Denver', 'CO', '80201'),
        ('Eve', 'Miller', 'eve.miller@email.com', '555-0107', '147 Birch Ct', 'Phoenix', 'AZ', '85001'),
        ('Frank', 'Wilson', 'frank.wilson@email.com', '555-0108', '258 Spruce Way', 'Miami', 'FL', '33101'),
        ('Grace', 'Moore', 'grace.moore@email.com', '555-0109', '369 Ash Blvd', 'Boston', 'MA', '02101'),
        ('Henry', 'Taylor', 'henry.taylor@email.com', '555-0110', '741 Willow Pl', 'Chicago', 'IL', '60601')
        ON CONFLICT (email) DO NOTHING;

        -- Insert products
        INSERT INTO products (product_name, category, price, stock_quantity, description) VALUES
        ('Laptop Pro 15', 'Electronics', 1299.99, 50, 'High-performance laptop'),
        ('Wireless Mouse', 'Electronics', 29.99, 200, 'Ergonomic wireless mouse'),
        ('USB-C Cable', 'Accessories', 12.99, 500, '6ft USB-C charging cable'),
        ('Desk Chair', 'Furniture', 249.99, 30, 'Ergonomic office chair'),
        ('Standing Desk', 'Furniture', 599.99, 15, 'Adjustable standing desk'),
        ('Monitor 27"', 'Electronics', 349.99, 75, '4K UHD monitor'),
        ('Keyboard Mechanical', 'Electronics', 89.99, 100, 'RGB mechanical keyboard'),
        ('Webcam HD', 'Electronics', 79.99, 60, '1080p webcam'),
        ('Desk Lamp', 'Accessories', 39.99, 150, 'LED desk lamp'),
        ('Notebook Set', 'Office Supplies', 19.99, 300, 'Pack of 3 notebooks')
        ON CONFLICT DO NOTHING;

        -- Insert orders
        INSERT INTO orders (customer_id, order_date, total_amount, status, shipping_address, shipping_city, shipping_state, shipping_zip) VALUES
        (1, '2024-01-15 10:30:00', 1329.98, 'delivered', '123 Main St', 'San Francisco', 'CA', '94102'),
        (2, '2024-01-16 14:20:00', 279.98, 'delivered', '456 Oak Ave', 'Los Angeles', 'CA', '90001'),
        (3, '2024-01-17 09:15:00', 849.98, 'shipped', '789 Pine Rd', 'Seattle', 'WA', '98101'),
        (4, '2024-01-18 16:45:00', 599.99, 'processing', '321 Elm St', 'Portland', 'OR', '97201'),
        (5, '2024-01-19 11:30:00', 169.97, 'delivered', '654 Maple Dr', 'Austin', 'TX', '78701')
        ON CONFLICT DO NOTHING;

        -- Insert order items
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES
        (1, 1, 1, 1299.99, 1299.99),
        (1, 2, 1, 29.99, 29.99),
        (2, 4, 1, 249.99, 249.99),
        (2, 2, 1, 29.99, 29.99),
        (3, 6, 2, 349.99, 699.98),
        (3, 7, 1, 89.99, 89.99),
        (3, 8, 1, 79.99, 79.99),
        (4, 5, 1, 599.99, 599.99),
        (5, 3, 3, 12.99, 38.97),
        (5, 9, 2, 39.99, 79.98),
        (5, 10, 3, 19.99, 59.97)
        ON CONFLICT DO NOTHING;
        """
        
        cursor.execute(sample_data_sql)
        conn.commit()
        
        # Get counts
        cursor.execute("SELECT COUNT(*) FROM customers")
        customer_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        product_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM orders")
        order_count = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Database seeded successfully',
                'customers': customer_count,
                'products': product_count,
                'orders': order_count
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
