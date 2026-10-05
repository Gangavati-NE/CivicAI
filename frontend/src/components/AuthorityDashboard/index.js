import {useEffect, useState} from 'react'

import './index.css'

const AuthorityDashboard = () => {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const loadComplaints = () => {
    setLoading(true)

    fetch('https://civicai-3oq2.onrender.com/api/complaints')
      .then(response => response.json())
      .then(data => {
        setComplaints(data)
        setLoading(false)
      })
      .catch(error => { console.error('Authority Dashboard error:', error); setLoading(false) })
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const pendingCount = complaints.filter(
    complaint => complaint.status === 'Pending',
  ).length

  const inProgressCount = complaints.filter(
    complaint => complaint.status === 'In Progress',
  ).length

  const resolvedCount = complaints.filter(
    complaint => complaint.status === 'Resolved',
  ).length

  const highPriorityComplaints = complaints.filter(
    complaint => complaint.severity === 'High',
  )

  const categories = [
    'All',
    ...new Set(complaints.map(complaint => complaint.category)),
  ]

  const filteredComplaints = complaints.filter(
    complaint =>
      (statusFilter === 'All' || complaint.status === statusFilter) &&
      (categoryFilter === 'All' || complaint.category === categoryFilter),
  )

  if (loading) {
    return <p>Loading complaints...</p>
  }

  return (
    <div className="authority-dashboard">
      <div className="dashboard-actions">
        <div className="dashboard-header">
          <h2>??? Authority Dashboard</h2>
          <p>Monitor and manage reported civic problems.</p>
        </div>

        <button
          className="refresh-button"
          type="button"
          onClick={loadComplaints}
        >
          ? Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Complaints</span>
          <strong>{complaints.length}</strong>
        </div>

        <div className="stat-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="stat-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
        </div>

        <div className="stat-card">
          <span>Resolved</span>
          <strong>{resolvedCount}</strong>
        </div>
      </div>

      <div className="high-priority-section">
        <h3>?? High Priority Complaints</h3>

        {highPriorityComplaints.length === 0 ? (
          <p>No high priority complaints.</p>
        ) : (
          highPriorityComplaints.map(complaint => (
            <div className="high-priority-card" key={complaint._id}>
              <h4>{complaint.description}</h4>
              <p>
                <strong>Category:</strong> {complaint.category}
              </p>
              <p>
                <strong>Location:</strong> {complaint.location}
              </p>
              <p>
                <strong>Severity:</strong> {complaint.severity}
              </p>
              <p>
                <strong>Affected Citizens:</strong>{' '}
                {complaint.duplicateCount || 1}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="complaints-section">
        <h3>Reported Civic Problems</h3>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {filteredComplaints.length === 0 ? (
          <p>No complaints found.</p>
        ) : (
          filteredComplaints.map(complaint => (
            <div className="complaint-card" key={complaint._id}>
              <h4>{complaint.description}</h4>

              <div className="complaint-meta">
                <div className="meta-item">
                  <span>Category</span>
                  <strong>{complaint.category}</strong>
                </div>

                <div className="meta-item">
                  <span>Location</span>
                  <strong>{complaint.location}</strong>
                </div>

                <div className="meta-item">
                  <span>Severity</span>
                  <strong>{complaint.severity}</strong>
                </div>

                <div className="meta-item">
                  <span>Affected Citizens</span>
                  <strong>{complaint.duplicateCount || 1}</strong>
                </div>
              </div>

              {complaint.aiAnalysis && (
                <div className="ai-analysis">
                  <strong>?? AI Analysis</strong>
                  <p>{complaint.aiAnalysis}</p>
                </div>
              )}

              {complaint.imageUrl && (
                <img
                  className="dashboard-image"
                  src={complaint.imageUrl}
                  alt="Civic problem evidence"
                />
              )}

              <select
                className="status-select"
                value={complaint.status}
                onChange={event => {
                  fetch(
                    `https://civicai-3oq2.onrender.com/api/complaints/${complaint._id}/status`,
                    {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        status: event.target.value,
                      }),
                    },
                  )
                    .then(response => response.json())
                    .then(data => {
                      setComplaints(currentComplaints =>
                        currentComplaints.map(item =>
                          item._id === complaint._id
                            ? data.complaint
                            : item,
                        ),
                      )
                    })
                }}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AuthorityDashboard


