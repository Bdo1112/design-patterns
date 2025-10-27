import express, { type Request, type Response } from 'express';

// Observer interface - stores webhook URL
interface Observer {
  id: string;
  webhookUrl: string;
}

// Data model
interface DataItem {
  id: number;
  name: string;
  value: string;
}

// Subject class - manages observers and data
class DatabaseSubject {
  private observers: Observer[] = [];
  private data: DataItem[] = [];
  private nextId = 1;

  // Subscribe an observer (register webhook)
  subscribe(observer: Observer): void {
    const exists = this.observers.find(obs => obs.id === observer.id);
    if (!exists) {
      this.observers.push(observer);
      console.log(`✅ Observer subscribed: ${observer.id} at ${observer.webhookUrl}`);
    }
  }

  // Unsubscribe an observer
  unsubscribe(observerId: string): void {
    const index = this.observers.findIndex(obs => obs.id === observerId);
    if (index !== -1) {
      this.observers.splice(index, 1);
      console.log(`❌ Observer unsubscribed: ${observerId}`);
    }
  }

  // Notify all observers via webhook
  private async notify(event: string, data: DataItem | number): Promise<void> {
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
      } catch (error) {
        console.error(`  ❌ Failed to notify ${observer.id}:`, error);
      }
    });

    await Promise.all(notifications);
  }

  // Data operations that trigger notifications
  async addData(name: string, value: string): Promise<DataItem> {
    const item: DataItem = {
      id: this.nextId++,
      name,
      value
    };
    this.data.push(item);
    await this.notify('DATA_ADDED', item);
    return item;
  }

  async updateData(id: number, name: string, value: string): Promise<DataItem | null> {
    const item = this.data.find(d => d.id === id);
    if (item) {
      item.name = name;
      item.value = value;
      await this.notify('DATA_UPDATED', item);
      return item;
    }
    return null;
  }

  async deleteData(id: number): Promise<boolean> {
    const index = this.data.findIndex(d => d.id === id);
    if (index !== -1) {
      this.data.splice(index, 1);
      await this.notify('DATA_DELETED', id);
      return true;
    }
    return false;
  }

  getData(): DataItem[] {
    return this.data;
  }

  getObservers(): Observer[] {
    return this.observers;
  }
}

// Initialize the subject
const dbSubject = new DatabaseSubject();

// Express server
const app = express();
app.use(express.json());

// Subscribe endpoint
app.post('/subscribe', (req: Request, res: Response) => {
  const { id, webhookUrl } = req.body;

  if (!id || !webhookUrl) {
    res.status(400).json({ error: 'id and webhookUrl are required' });
    return;
  }

  dbSubject.subscribe({ id, webhookUrl });
  res.json({ message: 'Subscribed successfully', id, webhookUrl });
});

// Unsubscribe endpoint
app.post('/unsubscribe', (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    res.status(400).json({ error: 'id is required' });
    return;
  }

  dbSubject.unsubscribe(id);
  res.json({ message: 'Unsubscribed successfully', id });
});

// Get all data
app.get('/data', (_req: Request, res: Response) => {
  res.json(dbSubject.getData());
});

// Add data
app.post('/data', async (req: Request, res: Response) => {
  const { name, value } = req.body;

  if (!name || !value) {
    res.status(400).json({ error: 'name and value are required' });
    return;
  }

  const item = await dbSubject.addData(name, value);
  res.status(201).json(item);
});

// Update data
app.put('/data/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id || '0');
  const { name, value } = req.body;

  if (!name || !value) {
    res.status(400).json({ error: 'name and value are required' });
    return;
  }

  const item = await dbSubject.updateData(id, name, value);
  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Delete data
app.delete('/data/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id || '0');
  const deleted = await dbSubject.deleteData(id);

  if (deleted) {
    res.json({ message: 'Deleted successfully', id });
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Get observers list
app.get('/observers', (_req: Request, res: Response) => {
  res.json(dbSubject.getObservers());
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🗄️  DB Server (Subject) running on http://localhost:${PORT}`);
});
