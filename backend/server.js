const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const OpenAI = require('openai')
const { Ollama } = require('ollama')
const ollama = new Ollama()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
require('dotenv').config()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const app = express()


const uploadDir = path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {recursive: true})
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({storage})
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully 🚀')
  })
  .catch(error => {
    console.log('MongoDB connection failed:', error.message)
  })

const complaintSchema = new mongoose.Schema({
  description: String,
  category: String,
  imageUrl: String,
  location: String,
  latitude: Number,
  longitude: Number,
  aiAnalysis: String,
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', default: null },
  duplicateCount: { type: Number, default: 1 },
  status: {
    type: String,
    default: 'Pending',
  },
  severity: {
    type: String,
    default: 'Medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Complaint = mongoose.model('Complaint', complaintSchema)

app.get('/', (req, res) => {
  res.json({
    message: 'CivicAI Backend is running 🚀',
  })
})

app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({createdAt: -1})

    res.json(complaints)
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Failed to fetch complaints',
    })
  }
})

app.put('/api/complaints/:id/status', async (req, res) => {
  const {status} = req.body

  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {status},
      {new: true},
    )

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      })
    }

    res.json({
      message: 'Complaint status updated successfully 🚀',
      complaint,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Failed to update complaint status',
    })
  }
})

app.post('/api/complaints', async (req, res) => {
 const {description, category: selectedCategory, location, imageUrl, aiAnalysis, latitude, longitude} = req.body
  if (!description) {
    return res.status(400).json({
      message: 'Complaint description is required',
    })
  }
  let finalAiAnalysis = aiAnalysis || ''

if (imageUrl) {
  try {
    const imagePath = imageUrl.replace('http://localhost:5000/uploads/', '')
    const fullImagePath = path.join(uploadDir, imagePath)

    const imageBuffer = fs.readFileSync(fullImagePath)
    const base64Image = imageBuffer.toString('base64')

    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'user',
          content:
            'Analyze this civic problem image. Identify the civic issue, describe what you see, and estimate severity as Low, Medium, or High.',
          images: [base64Image],
        },
      ],
    })

    finalAiAnalysis = response.message.content
  } catch (error) {
    console.log('AI analysis failed:', error)
  }
}

  let category = selectedCategory || 'Other'
  let severity = 'Medium'

  const text = description.toLowerCase()

  if (
    text.includes('pothole') ||
    text.includes('road') ||
    text.includes('broken road')
  ) {
    category = 'Road Damage'
  } else if (
    text.includes('garbage') ||
    text.includes('waste') ||
    text.includes('trash')
  ) {
    category = 'Garbage'
  } else if (
    text.includes('streetlight') ||
    text.includes('street light') ||
    text.includes('lamp')
  ) {
    category = 'Streetlight'
  } else if (
    text.includes('water leakage') ||
    text.includes('water leak') ||
    text.includes('leaking pipe')
  ) {
    category = 'Water Leakage'
  } else if (
    text.includes('drainage') ||
    text.includes('sewage') ||
    text.includes('drain')
  ) {
    category = 'Drainage'
  }

  if (
    text.includes('dangerous') ||
    text.includes('accident') ||
    text.includes('falling') ||
    text.includes('blocked') ||
    text.includes('emergency')
  ) {
    severity = 'High'
  }

  try {
    let existingDuplicate = null

if (latitude != null && longitude != null) {
  const nearbyComplaints = await Complaint.find({
    category,
    status: { $ne: 'Resolved' },
    latitude: { $ne: null },
    longitude: { $ne: null },
  }).sort({ createdAt: -1 })

  existingDuplicate = nearbyComplaints.find(complaint => {
    const latDifference = Math.abs(complaint.latitude - latitude)
    const lonDifference = Math.abs(complaint.longitude - longitude)

    return latDifference <= 0.005 && lonDifference <= 0.005
  })
}

if (!existingDuplicate && location) {
  existingDuplicate = await Complaint.findOne({
    category,
    location,
    status: { $ne: 'Resolved' },
  }).sort({ createdAt: -1 })
}

    const complaint = new Complaint({
      description,
      category,
      location,
      latitude,
      longitude,
      aiAnalysis: finalAiAnalysis,
      duplicateOf: existingDuplicate ? existingDuplicate._id : null,
      duplicateCount: 1,
      imageUrl,
      severity,
    })

    await complaint.save()

    if (existingDuplicate) {
      await Complaint.findByIdAndUpdate(
        existingDuplicate._id,
        { $inc: { duplicateCount: 1 } }
      )
    }

    res.json({
      message: 'Complaint analyzed and saved successfully 🚀',
      category,
      severity,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Failed to save complaint',
    })
  }
})
// Real AI image analysis will go here

 app.post('/api/ai/analyze-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No image uploaded',
    })
  }

  try {
    const imageBuffer = fs.readFileSync(req.file.path)
    const base64Image = imageBuffer.toString('base64')

    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'user',
          content:
            'Analyze this civic problem image. Identify the civic issue, describe what you see, and estimate severity as Low, Medium, or High.',
          images: [base64Image],
        },
      ],
    })

    res.json({
      message: 'Image analyzed successfully 🚀',
      analysis: response.message.content,
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      message: 'Local AI image analysis failed',
    })
  }
})
app.post('/api/ai/analyze', async (req, res) => {
  const {description} = req.body

  if (!description) {
    return res.status(400).json({
      message: 'Complaint description is required',
    })
  }

  let category = selectedCategory || 'Other'
  let severity = 'Medium'

  const text = description.toLowerCase()

  if (
    text.includes('pothole') ||
    text.includes('road') ||
    text.includes('broken road')
  ) {
    category = 'Road Damage'
  } else if (
    text.includes('garbage') ||
    text.includes('waste') ||
    text.includes('trash')
  ) {
    category = 'Garbage'
  } else if (
    text.includes('streetlight') ||
    text.includes('street light') ||
    text.includes('lamp')
  ) {
    category = 'Streetlight'
  } else if (
    text.includes('water leakage') ||
    text.includes('water leak') ||
    text.includes('leaking pipe')
  ) {
    category = 'Water Leakage'
  } else if (
    text.includes('drainage') ||
    text.includes('sewage') ||
    text.includes('drain')
  ) {
    category = 'Drainage'
  }

  if (
    text.includes('dangerous') ||
    text.includes('accident') ||
    text.includes('falling') ||
    text.includes('blocked') ||
    text.includes('emergency')
  ) {
    severity = 'High'
  }

  res.json({
    category,
    severity,
  })
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: 'No image uploaded',
    })
  }

  res.json({
  message: 'Image uploaded successfully 🚀',
  filename: req.file.filename,
  imageUrl: `http://localhost:5000/uploads/${req.file.filename}`,
})
})

const PORT = 5000


app.post('/api/complaints/:id/confirm', async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { $inc: { duplicateCount: 1 } },
      { new: true },
    )

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found',
      })
    }

    res.json({
      message: 'Your support was added ??',
      complaint,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Unable to confirm issue',
    })
  }
})

app.listen(PORT, () => {
  console.log(`CivicAI server running on port ${PORT}`)
})










