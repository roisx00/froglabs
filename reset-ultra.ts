import { db } from './src/lib/firebase';

async function resetUsers() {
    try {
        const usernames = ['tmareth', '.chrisbtc'];
        for (const username of usernames) {
            const snapshot = await db.collection('applications').where('username', '==', username).get();
            if (snapshot.empty) {
                console.log(`No user found with username: ${username}`);
                continue;
            }
            for (const doc of snapshot.docs) {
                await doc.ref.update({
                    hasOpenedMysteryBox: false
                });
                console.log(`Successfully reset hasOpenedMysteryBox for user ID: ${doc.id} (${username})`);
            }
        }
    } catch (err) {
        console.error("Failed to reset users:", err);
    } finally {
        process.exit(0);
    }
}

resetUsers();
