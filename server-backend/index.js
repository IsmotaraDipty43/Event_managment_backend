const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const app = express();
const cors = require("cors");
require("dotenv").config()
const port = process.env.PORT || 5001;


app.use(cors({
  origin: ['http://localhost:5173','https://events-managmnet-project43.netlify.app'], 
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],}

));
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xsfs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // await client.connect();
    const eventsCollection = client.db('Eventmanagmentdb').collection('AllEvents')
    const reviewCollection = client.db('Eventmanagmentdb').collection('Review')
     const userCollection = client.db('Eventmanagmentdb').collection('user')
app.get('/events', async (req, res) => {
  const events = await eventsCollection.find().toArray(); 
  res.json(events);
});

app.get('/review', async (req, res) => {
  const events = await reviewCollection.find().toArray(); 
  res.json(events);
});

app.post('/events', async (req, res) => {
  try {
    const {
      title,
      postedBy,
      email,         
      dateTime,
      location,
      description,
      attendeeCount = 0,
      image,
    } = req.body;

    if (!title || !postedBy || !email || !dateTime || !location || !description || !image) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = {
      title,
      postedBy,
      email,                           
      dateTime: new Date(dateTime),
      location,
      description,
      attendeeCount: Number(attendeeCount) || 0,
      image,
    };

    const result = await eventsCollection.insertOne(event);

    res.status(201).json({
      message: 'Event added successfully',
      eventId: result.insertedId,
    });

  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ error: 'Failed to add event' });
  }
});


app.post('/register', async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password || !image) {
      return res.status(400).json({ message: 'All fields are required' });
    }


    const exists = await userCollection.findOne({ email: email });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    await userCollection.insertOne({ name, email, password, image });

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /register:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/events', async (req, res) => {
  try {
    const events = await eventsCollection
      .find({})
      .sort({ dateTime: -1 }) 
      .toArray();

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' });
  }
});

app.patch('/api/events/:id/join', async (req, res) => {
      const { id } = req.params;

      try {
        const result = await eventsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { attendeeCount: 1 } }
        );

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: 'Attendee count increased' });
        } else {
          res.status(404).send({ success: false, message: 'Event not found' });
        }
      } catch (err) {
        res.status(500).send({ success: false, error: err.message });
      }
    });

app.get('/api/events/user-events', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }

    const events = await eventsCollection.find({ email }).toArray();
    res.json(events);
  } catch (error) {
    console.error('Failed to fetch user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

app.patch('/api/events/:id', async (req, res) => {

  const { id } = req.params;
  const {
    title,
    postedBy,
    dateTime,
    location,
    description,
    image
  } = req.body;

  try {
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          postedBy,
          dateTime: new Date(dateTime),
          location,
          description,
          image
        }
      }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Event updated successfully' });
    } else {
      res.status(404).json({ error: 'Event not found or unchanged' });
    }
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.json({ message: 'Event deleted' });
    } else {
      res.status(404).json({ error: 'Event not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error deleting event' });
  }
});
app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(200).json(event);
  } catch (err) {
    console.error('Error fetching event by ID:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
 

  }
}


run().catch(console.dir);
app.get('/', (req,res)=>{
    res.send('Job Task')
})
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});