import express, {} from 'express';
// Caller Server - Observer implementation
const app = express();
app.use(express.json());
const CALLER_ID = 'caller-app-1';
const CALLER_PORT = 3001;
const DB_SERVER_URL = 'http://localhost:3000';
// Webhook endpoint - receives notifications from DB server
app.post('/webhook', (req, res) => {
    const { event, data, timestamp } = req.body;
    console.log('\n🔔 Received notification from DB Server:');
    console.log(`  Event: ${event}`);
    console.log(`  Data:`, data);
    console.log(`  Timestamp: ${timestamp}`);
    // Here you can add custom logic based on the event type
    switch (event) {
        case 'DATA_ADDED':
            console.log(`  ➡️  New data added: ${data.name}`);
            break;
        case 'DATA_UPDATED':
            console.log(`  ➡️  Data updated: ${data.name}`);
            break;
        case 'DATA_DELETED':
            console.log(`  ➡️  Data deleted with ID: ${data}`);
            break;
        default:
            console.log(`  ➡️  Unknown event type`);
    }
    res.json({ status: 'received', message: 'Notification processed' });
});
// Subscribe to DB server
app.post('/subscribe', async (_req, res) => {
    try {
        const webhookUrl = `http://localhost:${CALLER_PORT}/webhook`;
        const response = await fetch(`${DB_SERVER_URL}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: CALLER_ID,
                webhookUrl
            })
        });
        const result = await response.json();
        console.log(`✅ Subscribed to DB server:`, result);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Failed to subscribe:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});
// Unsubscribe from DB server
app.post('/unsubscribe', async (_req, res) => {
    try {
        const response = await fetch(`${DB_SERVER_URL}/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: CALLER_ID
            })
        });
        const result = await response.json();
        console.log(`❌ Unsubscribed from DB server:`, result);
        res.json(result);
    }
    catch (error) {
        console.error('❌ Failed to unsubscribe:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'running', id: CALLER_ID });
});
app.listen(CALLER_PORT, () => {
    console.log(`📞 Caller Server (Observer) running on http://localhost:${CALLER_PORT}`);
    console.log(`   Webhook endpoint: http://localhost:${CALLER_PORT}/webhook`);
    console.log(`\n💡 To subscribe to DB server, run:`);
    console.log(`   curl -X POST http://localhost:${CALLER_PORT}/subscribe`);
});
//# sourceMappingURL=index.js.map