const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "voting_db2",
  password: "2406",
  port: 5432
});

async function setupDatabase() {
  try {
    console.log("Starting database setup...");

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        voter_id VARCHAR(50) UNIQUE NOT NULL,
        aadhar_number VARCHAR(20),
        age INTEGER NOT NULL,
        dob DATE NOT NULL,
        department VARCHAR(100),
        semester INTEGER,
        password VARCHAR(255) NOT NULL,
        voted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Users table created/verified");

    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        voter_id VARCHAR(50) UNIQUE NOT NULL,
        dob DATE NOT NULL,
        age INTEGER NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Admins table created/verified");

    // Create elections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Elections table created/verified");

    // Create candidates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        symbol VARCHAR(50),
        description TEXT,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        vote_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✓ Candidates table created/verified");

    // Create votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, election_id)
      )
    `);
    console.log("✓ Votes table created/verified");

    console.log("\n✅ Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
