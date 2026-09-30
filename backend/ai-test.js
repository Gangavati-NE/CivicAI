const mongoose = require('mongoose')
require('dotenv').config()
const {Ollama} = require('ollama')
const fs = require('fs')
const path = require('path')

const schema = new mongoose.Schema({
  description: String,
  category: String,
  location: String,
  imageUrl: String,
  aiAnalysis: String,
  severity: String,
  status: String,
  createdAt: Date,
})

const Complaint = mongoose.model('ComplaintAI', schema, 'complaints')
const ollama = new Ollama()

async function run() {
  await mongoose.connect(process.env.MONGO_URI)

  const complaint = await Complaint.findOne().sort({createdAt: -1})

  console.log('Image:', complaint.imageUrl)

  const filename = complaint.imageUrl.split('/').pop()
  const imagePath = path.join(__dirname, 'uploads', filename)

  console.log('Reading:', imagePath)

  const base64Image = fs.readFileSync(imagePath).toString('base64')

  console.log('Gemma analyzing...')

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

  console.log('\nAI RESULT:\n')
  console.log(response.message.content)

  complaint.aiAnalysis = response.message.content
  await complaint.save()

  console.log('\nAI analysis saved to MongoDB.')

  await mongoose.disconnect()
}

run().catch(error => {
  console.error('\nERROR:', error.message)
  process.exit(1)
})
