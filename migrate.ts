import * as fs from 'fs';
import { db } from './src/lib/firebase';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
    console.log('🚀 Starting migration...');

    // Migrate Applications
    if (fs.existsSync('applications.json')) {
        const apps = JSON.parse(fs.readFileSync('applications.json', 'utf8'));
        console.log(`Migrating ${apps.length} applications...`);
        for (const app of apps) {
            await db.collection('applications').doc(app.id).set(app);
        }
    }

    // Migrate Tasks
    if (fs.existsSync('tasks.json')) {
        const tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
        console.log(`Migrating ${tasks.length} tasks...`);
        for (const task of tasks) {
            await db.collection('tasks').doc(task.id).set(task);
        }
    }

    console.log('✅ Migration complete!');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
