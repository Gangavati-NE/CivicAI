import {useState} from 'react'

import './index.css'

const ComplaintForm = () => {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const [submittedComplaint, setSubmittedComplaint] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async event => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      let imageUrl = ''
      let aiAnalysis = ''

      if (image) {
        const formData = new FormData()
        formData.append('image', image)

        const uploadResponse = await fetch(
          'https://civicai-3oq2.onrender.com/api/upload',
          {
            method: 'POST',
            body: formData,
          },
        )

        if (!uploadResponse.ok) {
          throw new Error('Image upload failed')
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.imageUrl

        setMessage('AI is analyzing your evidence...')

        const imageAnalysisResponse = await fetch(
          'https://civicai-3oq2.onrender.com/api/ai/analyze-image',
          {
            method: 'POST',
            body: formData,
          },
        )

        if (imageAnalysisResponse.ok) {
          const analysisData = await imageAnalysisResponse.json()
          aiAnalysis = analysisData.analysis
        }
      }

      setMessage('Saving your complaint...')

      const response = await fetch(
        'https://civicai-3oq2.onrender.com/api/complaints',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description,
            category,
            location,
            imageUrl,
            aiAnalysis,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Complaint submission failed')
      }

      const data = await response.json()

      setMessage(data.message)

      setSubmittedComplaint({
        ...(data.complaint || {}),
        description,
        category: data.category || category,
        location,
        imageUrl,
        aiAnalysis,
        status: 'Pending',
        severity: data.severity || 'Medium',
        duplicateCount: 1,
      })

      setDescription('')
      setCategory('')
      setLocation('')
      setImage(null)
    } catch (error) {
      console.log(error)
      setMessage('Unable to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="complaint-container">
      <div className="complaint-heading">
        <span className="heading-icon">AI</span>
        <div>
          <h2>Report a Civic Problem</h2>
          <p>Help your community by reporting an issue.</p>
        </div>
      </div>

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Describe the problem</label>
          <textarea
            id="description"
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Example: Large pothole near the college..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={event => setCategory(event.target.value)}
              required
            >
              <option value="">Select category</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Garbage">Garbage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Drainage">Drainage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={event => setLocation(event.target.value)}
              placeholder="Example: Bengaluru"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="evidence">Photo Evidence</label>

          <div className="upload-box">
            <span>+</span>
            <p>Upload a photo of the civic problem</p>
            <input
              id="evidence"
              type="file"
              accept="image/*"
              onChange={event => setImage(event.target.files[0])}
            />
          </div>

          {image && (
            <p className="selected-file">
              Selected: {image.name}
            </p>
          )}
        </div>

        <button
          className="submit-button"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Analyzing & Submitting...' : 'Submit Complaint'}
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}

      {submittedComplaint && (
        <div className="tracking-card">
          <div className="tracking-header">
            <div>
              <h2>Complaint Submitted</h2>
              <p>Your complaint has been recorded successfully.</p>
            </div>
            <span className="status-badge">
              {submittedComplaint.status}
            </span>
          </div>

          <div className="tracking-grid">
            <div>
              <span>Problem</span>
              <strong>{submittedComplaint.description}</strong>
            </div>

            <div>
              <span>Category</span>
              <strong>{submittedComplaint.category}</strong>
            </div>

            <div>
              <span>Location</span>
              <strong>{submittedComplaint.location}</strong>
            </div>

            <div>
              <span>Severity</span>
              <strong>{submittedComplaint.severity}</strong>
            </div>

            <div>
              <span>Affected Citizens</span>
              <strong>
                {submittedComplaint.duplicateCount || 1}
              </strong>
            </div>
          </div>

          {submittedComplaint.aiAnalysis && (
            <div className="ai-box">
              <h3>AI Analysis</h3>
              <p>{submittedComplaint.aiAnalysis}</p>
            </div>
          )}

          {submittedComplaint.imageUrl && (
            <img
              className="evidence-image"
              src={submittedComplaint.imageUrl}
              alt="Civic problem evidence"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ComplaintForm




