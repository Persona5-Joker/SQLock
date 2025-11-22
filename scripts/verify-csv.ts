import { executeCsvQuery } from "../src/server/csv-adapter";

async function main() {
    console.log("Testing CSV Adapter...");

    try {
        // Test SELECT
        console.log("Running SELECT query...");
        const rows = await executeCsvQuery("SELECT * FROM employee_info LIMIT 5");
        console.log("SELECT Result:", rows);

        if (!Array.isArray(rows) || rows.length === 0) {
            console.error("SELECT failed or returned empty.");
        } else {
            console.log("SELECT success.");
        }

        // Test INSERT Logs
        console.log("Running INSERT Logs query...");
        await executeCsvQuery(
            "INSERT INTO Logs (decision, suspicion_score, query_template) VALUES (?, ?, ?)",
            ["block", 0.99, "SELECT * FROM users"]
        );
        console.log("INSERT success.");

        // Verify INSERT
        console.log("Verifying INSERT...");
        const logs = await executeCsvQuery("SELECT * FROM Logs ORDER BY id DESC LIMIT 1");
        console.log("Latest Log:", logs);

    } catch (error) {
        console.error("Test failed:", error);
    }
}

main();
