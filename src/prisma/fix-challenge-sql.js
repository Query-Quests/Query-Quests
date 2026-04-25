/**
 * Patch the 3 challenges whose seeded solutions reference columns/
 * tables that don't exist in the actual `practice` schema. Idempotent.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const updates = [
  {
    name: "Pedidos recientes",
    statement:
      "List every customer who placed an order in the last two years, with their total spend across all orders. Sort by total spend descending.",
    solution:
      "SELECT customer_name, SUM(total_amount) AS total_spent\nFROM orders\nWHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 2 YEAR)\nGROUP BY customer_name\nORDER BY total_spent DESC;",
    help: "Use SUM with GROUP BY customer_name. Filter with WHERE on order_date.",
  },
  {
    name: "Productos sin pedidos",
    statement:
      "Find every product that has never been ordered (no row in `orders`). Return the full product row.",
    solution:
      "SELECT *\nFROM products\nWHERE id NOT IN (SELECT product_id FROM orders WHERE product_id IS NOT NULL);",
    help: "Use NOT IN with a subquery on orders. Watch out for NULL product_id values.",
  },
  {
    name: "Mes con mayores ventas por año",
    statement:
      "For each year, return the month with the highest total order revenue. Use total_amount as the revenue measure.",
    solution:
      "SELECT * FROM (\n  SELECT YEAR(order_date) AS year,\n         MONTH(order_date) AS month,\n         SUM(total_amount) AS total_sales,\n         ROW_NUMBER() OVER (PARTITION BY YEAR(order_date) ORDER BY SUM(total_amount) DESC) AS rn\n  FROM orders\n  GROUP BY YEAR(order_date), MONTH(order_date)\n) ranked\nWHERE rn = 1;",
    help: "Aggregate by (year, month), then pick the top month per year using ROW_NUMBER OVER PARTITION BY year.",
  },
];

async function main() {
  for (const u of updates) {
    const c = await prisma.challenge.findFirst({ where: { name: u.name } });
    if (!c) {
      console.log(`! could not find challenge "${u.name}"`);
      continue;
    }
    await prisma.challenge.update({
      where: { id: c.id },
      data: {
        statement: u.statement,
        solution: u.solution,
        help: u.help,
        // Reset the bad expectedResult so the wire script captures fresh.
        expectedResult: null,
        database_id: null,
      },
    });
    // Drop any stale dataset rows (they may have wrong hashes)
    await prisma.challengeDataset.deleteMany({ where: { challenge_id: c.id } });
    console.log(`+ patched "${u.name}"`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
