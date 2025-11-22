
async function main() {
    console.log("Testing DB Fallback...");

    // Set bad DB URL to force connection failure
    process.env.DATABASE_URL = "mysql://user:pass@localhost:9999/sqlock_test";

    try {
        // Dynamic import to ensure env is read after setting it
        // We need to handle the path alias manually if tsx doesn't resolve it, 
        // but tsx should resolve it if tsconfig is present.
        // If not, we might need to register tsconfig-paths.
        // Let's assume tsx handles it or we use relative paths if possible.
        // But db.ts uses "~/env", so we rely on tsconfig resolution.

        const { query } = await import("../src/server/db");

        console.log("Attempting query with bad DB URL...");
        const rows = await query("SELECT * FROM employee_info LIMIT 1");
        console.log("Query returned rows:", Array.isArray(rows) ? rows.length : "Not an array");

        if (Array.isArray(rows) && rows.length > 0) {
            console.log("Fallback success: Data returned despite DB failure.");
        } else {
            console.error("Fallback failed: No data returned.");
        }
    } catch (e) {
        console.error("Query threw error:", e);
    }
}

main();
