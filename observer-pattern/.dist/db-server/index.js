import express, {} from 'express';
// Subject class - manages observers and data
class DatabaseSubject {
    observers = [];
    data = [];
    nextId = 1;
    // Subscribe an observer (register webhook)
    subscribe(observer) {
        const exists = this.observers.find(obs => obs.id === observer.id);
        if (!exists) {
            this.observers.push(observer);
            console.log(`✅ Observer subscribed: ${observer.id} at ${observer.webhookUrl}`);
        }
    }
    // Unsubscribe an observer
    unsubscribe(observerId) {
        const index = this.observers.findIndex(obs => obs.id === observerId);
        if (index !== -1) {
            this.observers.splice(index, 1);
            console.log(`❌ Observer unsubscribed: ${observerId}`);
        }
    }
    // Notify all observers via webhook
    async notify(event, data) {
        console.log(`📢 Notifying ${this.observers.length} observer(s) about: ${event}`);
        const payload = {
            event,
            data,
            timestamp: new Date().toISOString()
        };
        // Send webhook to all observers
        const notifications = this.observers.map(async (observer) => {
            try {
                const response = await fetch(observer.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                console.log(`  → Notified ${observer.id}: ${response.status}`);
            }
            catch (error) {
                console.error(`  ❌ Failed to notify ${observer.id}:`, error);
            }
        });
        await Promise.all(notifications);
    }
    // Data operations that trigger notifications
    async addData(name, value) {
        const item = {
            id: this.nextId++,
            name,
            value
        };
        this.data.push(item);
        await this.notify('DATA_ADDED', item);
        return item;
    }
    async updateData(id, name, value) {
        const item = this.data.find(d => d.id === id);
        if (item) {
            item.name = name;
            item.value = value;
            await this.notify('DATA_UPDATED', item);
            return item;
        }
        return null;
    }
    async deleteData(id) {
        const index = this.data.findIndex(d => d.id === id);
        if (index !== -1) {
            this.data.splice(index, 1);
            await this.notify('DATA_DELETED', id);
            return true;
        }
        return false;
    }
    getData() {
        return this.data;
    }
    getObservers() {
        return this.observers;
    }
}
// Initialize the subject
const dbSubject = new DatabaseSubject();
// Express server
const app = express();
app.use(express.json());
// Subscribe endpoint
app.post('/subscribe', (req, res) => {
    const { id, webhookUrl } = req.body;
    if (!id || !webhookUrl) {
        res.status(400).json({ error: 'id and webhookUrl are required' });
        return;
    }
    dbSubject.subscribe({ id, webhookUrl });
    res.json({ message: 'Subscribed successfully', id, webhookUrl });
});
// Unsubscribe endpoint
app.post('/unsubscribe', (req, res) => {
    const { id } = req.body;
    if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
    }
    dbSubject.unsubscribe(id);
    res.json({ message: 'Unsubscribed successfully', id });
});
// Get all data
app.get('/data', (_req, res) => {
    res.json(dbSubject.getData());
});
// Add data
app.post('/data', async (req, res) => {
    const { name, value } = req.body;
    if (!name || !value) {
        res.status(400).json({ error: 'name and value are required' });
        return;
    }
    const item = await dbSubject.addData(name, value);
    res.status(201).json(item);
});
// Update data
app.put('/data/:id', async (req, res) => {
    const id = parseInt(req.params.id || '0');
    const { name, value } = req.body;
    if (!name || !value) {
        res.status(400).json({ error: 'name and value are required' });
        return;
    }
    const item = await dbSubject.updateData(id, name, value);
    if (item) {
        res.json(item);
    }
    else {
        res.status(404).json({ error: 'Item not found' });
    }
});
// Delete data
app.delete('/data/:id', async (req, res) => {
    const id = parseInt(req.params.id || '0');
    const deleted = await dbSubject.deleteData(id);
    if (deleted) {
        res.json({ message: 'Deleted successfully', id });
    }
    else {
        res.status(404).json({ error: 'Item not found' });
    }
});
// Get observers list
app.get('/observers', (_req, res) => {
    res.json(dbSubject.getObservers());
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🗄️  DB Server (Subject) running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map