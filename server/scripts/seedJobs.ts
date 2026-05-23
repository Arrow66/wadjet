import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../cache.sqlite');

function seedDatabase() {
  console.log(`Seeding database at ${DB_PATH}...`);
  
  // Create tables if they don't exist (in case the server hasn't started yet)
  const db = new Database(DB_PATH);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      condensed_description TEXT,
      trust_score INTEGER,
      quality_score INTEGER,
      is_remote BOOLEAN,
      country TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  const mockJobs = [
    {
      url: 'https://careers.google.com/jobs/results/123',
      title: 'Senior Machine Learning Engineer',
      company: 'Google',
      description: 'Develop large scale distributed systems for Google DeepMind. Lead research into next-generation RLHF models.',
      trustScore: 98,
      qualityScore: 95,
      isRemote: 1,
      country: 'US'
    },
    {
      url: 'https://jobs.shopify.com/124',
      title: 'Staff Frontend Developer',
      company: 'Shopify',
      description: 'Build core merchant experiences using React, Hydrogen, and GraphQL. Remote-first culture.',
      trustScore: 95,
      qualityScore: 90,
      isRemote: 1,
      country: 'Canada'
    },
    {
      url: 'https://careers.stripe.com/125',
      title: 'Backend Security Engineer',
      company: 'Stripe',
      description: 'Protect financial infrastructure. Write secure Rust and Go. Monitor threat intelligence feeds.',
      trustScore: 99,
      qualityScore: 88,
      isRemote: 0,
      country: 'UK'
    },
    {
      url: 'https://jobs.scotiabank.com/126',
      title: 'Full Stack Engineer',
      company: 'Scotiabank',
      description: 'Develop clean, maintainable code using .NET, C#, Java, React. Build REST APIs and microservices.',
      trustScore: 85,
      qualityScore: 70,
      isRemote: 1,
      country: 'Canada'
    },
    {
      url: 'https://scam.job/127',
      title: 'Data Entry Clerk - High Pay!',
      company: 'Unknown Inc',
      description: 'Make $500/hr entering data from home. Just send us a $50 processing fee first.',
      trustScore: 12,
      qualityScore: 5,
      isRemote: 1,
      country: 'Worldwide'
    },
    {
      url: 'https://atlassian.com/jobs/128',
      title: 'Platform Engineer',
      company: 'Atlassian',
      description: 'Scale our Kubernetes clusters globally. Remote from anywhere in ANZ.',
      trustScore: 94,
      qualityScore: 85,
      isRemote: 1,
      country: 'Australia'
    }
  ];

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO jobs 
    (url, title, company, condensed_description, trust_score, quality_score, is_remote, country, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((jobs) => {
    for (const job of jobs) {
      stmt.run(
        job.url,
        job.title,
        job.company,
        job.description,
        job.trustScore,
        job.qualityScore,
        job.isRemote,
        job.country,
        Date.now()
      );
    }
  });

  insertMany(mockJobs);
  console.log('Database seeded successfully with 6 jobs!');
  db.close();
}

seedDatabase();
