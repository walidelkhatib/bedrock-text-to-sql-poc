# Example Queries

This document contains example natural language queries you can use to test the Bedrock Text-to-SQL agent.

## Basic Queries

### Customer Queries
- "How many customers do we have?"
- "Show me all customers"
- "List customers from California"
- "Find customers in New York"
- "Show me customer emails"

### Product Queries
- "How many products are there?"
- "Show me all products"
- "List products in the Electronics category"
- "What products do we have in Furniture?"
- "Show me products under $50"

### Order Queries
- "How many orders do we have?"
- "Show me all orders"
- "List orders from January 2024"
- "Show me pending orders"
- "What orders were completed?"

## Aggregation Queries

### Counts
- "How many orders were placed in January 2024?"
- "Count the number of products in each category"
- "How many customers are from Texas?"

### Sums and Totals
- "What is the total revenue?"
- "Calculate total sales for January 2024"
- "What is the total value of all orders?"
- "Sum up revenue by product category"

### Averages
- "What is the average order value?"
- "Calculate the average product price"
- "What's the average number of items per order?"

### Min/Max
- "What is the most expensive product?"
- "Show me the cheapest product"
- "What was the largest order?"

## Join Queries

### Customer + Orders
- "Show me customers with their order counts"
- "List customers who have placed orders"
- "Which customers have spent more than $1000?"
- "Show me customers from California with their orders"

### Products + Sales
- "What are the top 5 best-selling products?"
- "Show me products that have been ordered"
- "List products with their total sales"
- "Which products have never been ordered?"

### Complete Order Details
- "Show me order details with customer names"
- "List all orders with product information"
- "Display orders with customer and product details"

## Complex Analytical Queries

### Revenue Analysis
- "What is the total revenue by product category?"
- "Show me monthly revenue for 2024"
- "Calculate revenue by state"
- "What is the revenue breakdown by product?"

### Top Performers
- "Who are the top 5 customers by total spending?"
- "What are the top 3 product categories by revenue?"
- "Show me the best-selling products this month"

### Trends and Patterns
- "How many orders were placed each day in January?"
- "Show me the distribution of orders by status"
- "What is the average order value by state?"

### Inventory and Stock
- "Which products have low stock (less than 100)?"
- "Show me products that need restocking"
- "List products with their current stock levels"

## Filtering and Sorting

### Date Filters
- "Show me orders from the last week"
- "List orders placed after January 15, 2024"
- "Find orders from January 2024"

### Price Filters
- "Show me products priced between $20 and $100"
- "List products more expensive than $500"
- "Find products under $30"

### Status Filters
- "Show me all pending orders"
- "List completed orders"
- "Find orders that are being processed"

### Sorting
- "Show me customers ordered by name"
- "List products sorted by price descending"
- "Display orders sorted by date"

## Multi-Table Queries

### Sales Summary
- "Show me a complete sales summary"
- "List all sales with customer and product details"
- "Display order information with customer names and product names"

### Customer Purchase History
- "What products has John Smith purchased?"
- "Show me the purchase history for customer ID 1"
- "List all products bought by customers in California"

### Product Performance
- "Which products are most popular in Texas?"
- "Show me product sales by region"
- "What categories sell best in California?"

## Error Handling Tests

These queries should be safely rejected:

### Dangerous Operations (Should Fail)
- "Delete all customers"
- "Drop the orders table"
- "Update all product prices to $0"
- "Insert a new customer"
- "Truncate the database"

### Invalid Queries (Should Error Gracefully)
- "Show me data from nonexistent_table"
- "Select * from fake_table"
- "Give me information about unicorns"

## Advanced Queries

### Subqueries
- "Show me customers who have placed more orders than average"
- "List products with above-average prices"
- "Find orders larger than the average order value"

### Grouping
- "Group orders by customer and show totals"
- "Show me sales grouped by product category"
- "Display order counts by status"

### Having Clauses
- "Show me categories with more than 2 products"
- "List customers who have placed more than 1 order"
- "Find products that have been ordered more than 5 times"

## Business Intelligence Queries

### Customer Insights
- "Who are our most valuable customers?"
- "Which states have the most customers?"
- "What is the customer distribution by state?"

### Product Insights
- "What is our product mix by category?"
- "Which categories generate the most revenue?"
- "What is the profit margin by product?"

### Sales Insights
- "What is our order fulfillment rate?"
- "How many orders are in each status?"
- "What is the average time between orders?"

## Tips for Writing Queries

1. **Be Specific**: "Show me customers from California" is better than "Show me customers"
2. **Use Natural Language**: Write as you would ask a human
3. **Include Context**: "in January 2024" or "from Electronics category"
4. **Ask for Summaries**: "total revenue", "average price", "count of orders"
5. **Request Sorting**: "top 5", "sorted by price", "ordered by date"

## Expected Response Format

The agent will:
1. Understand your question
2. Generate appropriate SQL
3. Execute the query
4. Format results in a readable way
5. Provide context and explanations

Example response:
```
I found 10 customers in our database. Here are the details:

1. John Smith (john.smith@email.com) - New York, NY
2. Sarah Johnson (sarah.j@email.com) - Los Angeles, CA
...

Would you like to see more details about any specific customer?
```
