// Script to Execute Test Queries
import { getDatabase } from '../src/db-connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to project root directory
const PROJECT_ROOT = join(__dirname, '..', '..');

function runTestQueries(): void {
    console.log('=== Running Test Queries for Online Wiki Database ===\n');
    
    const db = getDatabase();
    const queriesPath = join(PROJECT_ROOT, 'queries', 'test-queries.sql');
    const sqlContent = readFileSync(queriesPath, 'utf-8');
    
    // Split queries by the comment headers
    const queries = sqlContent.split(/-- Query \d+:/).slice(1);
    
    queries.forEach((queryBlock: string, index: number) => {
        const lines = queryBlock.trim().split('\n');
        const description = lines[0].trim();
        
        // Extract the actual SQL query (skip all comment lines, get first SQL statement)
        const sqlLines: string[] = [];
        let foundSelect = false;
        for (const line of lines) {
            const trimmed = line.trim();
            // Skip comment-only lines
            if (trimmed.startsWith('--')) continue;
            // Start collecting once we hit SELECT
            if (!foundSelect && trimmed.toUpperCase().startsWith('SELECT')) {
                foundSelect = true;
            }
            if (foundSelect) {
                sqlLines.push(line);
            }
        }
        
        const query = sqlLines.join('\n').trim();
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Query ${index + 1}: ${description}`);
        console.log(`${'='.repeat(80)}\n`);
        
        try {
            const startTime = Date.now();
            const results = db.prepare(query).all();
            const endTime = Date.now();
            
            console.log(`Execution time: ${endTime - startTime}ms`);
            console.log(`Results found: ${results.length}\n`);
            
            if (results.length > 0) {
                // Display results in a formatted table
                const keys = Object.keys(results[0] as Record<string, any>);
                
                // Print header
                console.log(keys.join(' | '));
                console.log('-'.repeat(keys.join(' | ').length));
                
                // Print rows (limit to first 10 for readability)
                const displayLimit = Math.min(results.length, 10);
                for (let i = 0; i < displayLimit; i++) {
                    const row = results[i] as Record<string, any>;
                    const values = keys.map(key => {
                        const value = row[key];
                        if (value === null) return 'NULL';
                        if (typeof value === 'string' && value.length > 50) {
                            return value.substring(0, 47) + '...';
                        }
                        return String(value);
                    });
                    console.log(values.join(' | '));
                }
                
                if (results.length > displayLimit) {
                    console.log(`\n... and ${results.length - displayLimit} more rows`);
                }
            } else {
                console.log('No results found.');
            }
            
        } catch (error) {
            console.error(`Error executing query: ${error}`);
        }
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('All test queries completed!');
    console.log(`${'='.repeat(80)}\n`);
}

// Run the queries
runTestQueries();

