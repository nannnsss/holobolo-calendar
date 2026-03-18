const express = require('express');
const path = require('path');
const { initDatabase, db } = require('./database.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// GET /api/events
app.get('/api/events', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY start ASC').all();
    const parsed = events.map(e => ({
      ...e,
      allDay: Boolean(e.allDay),
      extendedProps: { description: e.description || '' }
    }));
    res.json(parsed);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events
app.post('/api/events', (req, res) => {
  try {
    const { id, title, start, end, allDay, color, description } = req.body;
    if (!id || !title || !start || !end) {
      return res.status(400).json({ error: 'id, title, start, and end are required' });
    }
    db.prepare(
      'INSERT INTO events (id, title, start, end, allDay, color, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, title, start, end, allDay ? 1 : 0, color || '#6366f1', description || '');
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id
app.put('/api/events/:id', (req, res) => {
  try {
    const { title, start, end, allDay, color, description } = req.body;
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Event not found' });

    db.prepare(
      'UPDATE events SET title = ?, start = ?, end = ?, allDay = ?, color = ?, description = ? WHERE id = ?'
    ).run(
      title ?? existing.title,
      start ?? existing.start,
      end ?? existing.end,
      allDay !== undefined ? (allDay ? 1 : 0) : existing.allDay,
      color ?? existing.color,
      description !== undefined ? description : (existing.description || ''),
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id
app.delete('/api/events/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// GET /api/events.ics - iCal feed for Homarr
app.get('/api/events.ics', (req, res) => {
  try {
    const events = db.prepare('SELECT * FROM events ORDER BY start ASC').all();
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HoloBolo//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:HoloBolo Calendar'
    ];

    for (const event of events) {
      ical.push('BEGIN:VEVENT');
      ical.push('UID:' + event.id + '@holobolo.org');
      ical.push('SUMMARY:' + event.title.replace(/[,;\\]/g, '\\$&'));
      if (event.description) {
        const desc = 'DESCRIPTION:' + event.description.replace(/\n/g, '\\n').replace(/[,;\\]/g, '\\$&');
        ical.push(desc);
      }
      if (event.allDay) {
        ical.push('DTSTART;VALUE=DATE:' + event.start.split('T')[0].replace(/-/g, ''));
        ical.push('DTEND;VALUE=DATE:' + event.end.split('T')[0].replace(/-/g, ''));
      } else {
        ical.push('DTSTART:' + event.start.replace(/[-:]/g, '').split('.')[0]);
        ical.push('DTEND:' + event.end.replace(/[-:]/g, '').split('.')[0]);
      }
      ical.push('END:VEVENT');
    }

    ical.push('END:VCALENDAR');
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendar.ics"'
    });
    res.send(ical.join('\r\n'));
  } catch (err) {
    console.error('Error generating iCal:', err);
    res.status(500).send('Failed to generate calendar');
  }
});

// Start
initDatabase();
app.listen(PORT, '0.0.0.0', () => {
  console.log('HoloBolo Calendar running on port ' + PORT);
});
