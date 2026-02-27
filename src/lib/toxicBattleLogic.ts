// src/lib/toxicBattleLogic.ts

export interface Agent {
    id: string;
    name: string;
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    powers: string[];
    isAlive: boolean;
    tier: string;
}

export interface BattleLog {
    timestamp: string;
    message: string;
    type: 'attack' | 'power' | 'elimination' | 'system';
}

// Very basic MVP logic for auto-battling 12 agents
export function simulateBattle(agents: Agent[]): { winner: Agent, logs: BattleLog[] } {
    let logs: BattleLog[] = [];
    let activeAgents = [...agents];
    let tick = 0;

    logs.push({ timestamp: '[00:00]', message: 'INITIATING BATTLE SEQUENCE...', type: 'system' });
    logs.push({ timestamp: '[00:01]', message: `12 AGENTS DETECTED IN ARENA. SECURING PERIMETER.`, type: 'system' });

    while (activeAgents.filter(a => a.isAlive).length > 1 && tick < 100) { // Safety break at 100 ticks
        tick++;
        const timeStr = `[00:${tick.toString().padStart(2, '0')}]`;

        // Every alive agent gets a turn
        for (let i = 0; i < activeAgents.length; i++) {
            const attacker = activeAgents[i];
            if (!attacker.isAlive) continue;

            // Find valid target
            const validTargets = activeAgents.filter(a => a.isAlive && a.id !== attacker.id);
            if (validTargets.length === 0) break; // We won

            const target = validTargets[Math.floor(Math.random() * validTargets.length)];

            // Calculate Damage
            let dmgDealt = attacker.damage;
            let logType: 'attack' | 'power' | 'elimination' = 'attack';
            let attackMsg = `${attacker.name} engaged ${target.name} for ${dmgDealt} DMG.`;

            // Super Powers Math
            if (attacker.powers.includes('chaos_mode') && Math.random() > 0.8) {
                dmgDealt *= 3;
                attackMsg = `⚡ CRITICAL SPIKE: ${attacker.name} hit ${target.name} for ${dmgDealt} DMG.`;
                logType = 'power';
            }
            if (attacker.powers.includes('toxic_spray') && Math.random() > 0.5) {
                dmgDealt += 15;
                attackMsg = `🧪 TOXIC LEAK: ${attacker.name} poisoned ${target.name} for ${dmgDealt} DMG.`;
                logType = 'power';
            }
            if (target.powers.includes('shield_protocol') && Math.random() > 0.6) {
                dmgDealt = Math.max(0, dmgDealt - 20);
                attackMsg = `🛡️ SHIELDED: ${target.name} absorbed attack from ${attacker.name}. (${dmgDealt} DMG taken)`;
                logType = 'power';
            }

            // Apply Damage
            target.health -= dmgDealt;

            logs.push({ timestamp: timeStr, message: attackMsg, type: logType });

            // Check Death
            if (target.health <= 0) {
                target.isAlive = false;
                logs.push({ timestamp: timeStr, message: `⚠️ FATAL: ${target.name} HAS BEEN ELIMINATED.`, type: 'elimination' });
            }
        }
    }

    const winner = activeAgents.find(a => a.isAlive) || agents[0];
    logs.push({ timestamp: `[00:${(tick + 1).toString().padStart(2, '0')}]`, message: 'BATTLE CONCLUDED.', type: 'system' });
    logs.push({ timestamp: `[00:${(tick + 2).toString().padStart(2, '0')}]`, message: `WINNER DECLARED: ${winner.name}`, type: 'system' });

    return { winner, logs };
}
