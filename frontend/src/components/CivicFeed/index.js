import {useEffect, useState} from 'react'

import './index.css'

const CivicFeed = () => {
  const [complaints, setComplaints] = useState([])
  const [activeTab, setActiveTab] = useState('For You')
  const [loading, setLoading] = useState(true)
  const [confirmedIds, setConfirmedIds] = useState([])
  const [userLocation] = useState(null)

  useEffect(() => {
    fetch('https://civicai-3oq2.onrender.com/api/complaints')
      .then(response => response.json())
      .then(data => {
        setComplaints(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const confirmIssue = async id => {
    if (confirmedIds.includes(id)) {
      return
    }

    try {
      const response = await fetch(
        `https://civicai-3oq2.onrender.com/api/complaints/${id}/confirm`,
        {
          method: 'POST',
        },
      )

      if (!response.ok) {
        throw new Error('Unable to confirm issue')
      }

      const data = await response.json()

      setComplaints(currentComplaints =>
        currentComplaints.map(complaint =>
          complaint._id === id ? data.complaint : complaint,
        ),
      )

      setConfirmedIds(currentIds => [...currentIds, id])
    } catch (error) {
      console.log(error)
    }
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371
    const latDistance = ((lat2 - lat1) * Math.PI) / 180
    const lonDistance = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(lonDistance / 2) *
        Math.sin(lonDistance / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadius * c
  }

  const getVisibleComplaints = () => {
    if (activeTab === 'Trending') {
      return [...complaints].sort(
        (a, b) => (b.duplicateCount || 1) - (a.duplicateCount || 1),
      )
    }

    if (activeTab === 'Nearby') {
      if (!userLocation) {
        return []
      }

      return complaints
        .filter(
          complaint =>
            complaint.latitude !== null &&
            complaint.longitude !== null &&
            complaint.latitude !== undefined &&
            complaint.longitude !== undefined,
        )
        .map(complaint => ({
          ...complaint,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            complaint.latitude,
            complaint.longitude,
          ),
        }))
        .filter(complaint => complaint.distance <= 5)
        .sort((a, b) => a.distance - b.distance)
    }

    return complaints
  }

  const visibleComplaints = getVisibleComplaints()

  if (loading) {
    return (
      <div className="feed-loading">
        <div className="loading-orb">??</div>
        <h3>Loading your civic feed...</h3>
        <p>CivicAI is gathering local reports.</p>
      </div>
    )
  }

  return (
    <div className="civic-feed">
      <div className="feed-intro">
        <div>
          <p className="eyebrow">YOUR CITY. YOUR VOICE.</p>
          <h1>See it. Report it. Improve it.</h1>
          <p className="feed-subtitle">
            Discover civic problems reported by people around you.
          </p>
        </div>

        <div className="city-badge">?? Your City</div>
      </div>

      <div className="feed-tabs">
        {['For You', 'Nearby', 'Trending'].map(tab => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'feed-tab active' : 'feed-tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'Trending' && '?? '}
            {tab === 'Nearby' && '?? '}
            {tab}
          </button>
        ))}
      </div>

      <div className="feed-list">
        {visibleComplaints.length === 0 ? (
          <div className="empty-feed">
            <div>??</div>
            <h3>No civic reports yet</h3>
            <p>
              Be the first person to report a problem in your community.
            </p>
          </div>
        ) : (
          visibleComplaints.map(complaint => {
            const affectedCount = complaint.duplicateCount || 1
            const hasConfirmed = confirmedIds.includes(complaint._id)

            return (
              <article className="civic-post" key={complaint._id}>
                <div className="post-header">
                  <div className="post-avatar">???</div>

                  <div>
                    <strong>CivicAI Community</strong>
                    <p>
                      ?? {complaint.location || 'Location not provided'} ·
                      {' '}
                      Civic Report
                      {activeTab === 'Nearby' &&
                        typeof complaint.distance === 'number' && (
                          <>
                            {' · '}
                            {complaint.distance < 1
                              ? `${Math.round(complaint.distance * 1000)} m away`
                              : `${complaint.distance.toFixed(1)} km away`}
                          </>
                        )}
                    </p>
                  </div>
                </div>

                {complaint.imageUrl && (
                  <div className="post-image-wrapper">
                    <img
                      className="post-image"
                      src={complaint.imageUrl}
                      alt="Civic problem"
                    />

                    <span
                      className={
                        complaint.severity === 'High'
                          ? 'severity high'
                          : complaint.severity === 'Medium'
                            ? 'severity medium'
                            : 'severity low'
                      }
                    >
                      {complaint.severity === 'High'
                        ? '?? High Priority'
                        : complaint.severity === 'Medium'
                          ? 'Medium'
                          : 'Low'}
                    </span>
                  </div>
                )}

                <div className="post-content">
                  <div className="category-pill">
                    {complaint.category}
                  </div>

                  <h2>{complaint.description}</h2>

                  {complaint.aiAnalysis && (
                    <div className="ai-preview">
                      <span>AI</span>
                      <div>
                        <strong>CivicAI detected</strong>
                        <p>{complaint.aiAnalysis}</p>
                      </div>
                    </div>
                  )}

                  <div className="post-actions">
                    <button type="button">
                      {affectedCount}
                    </button>

                    <button type="button">Discuss</button>

                    <button
                      type="button"
                      className={
                        hasConfirmed
                          ? 'affected-button confirmed'
                          : 'affected-button'
                      }
                      onClick={() => confirmIssue(complaint._id)}
                      disabled={hasConfirmed}
                    >
                      {hasConfirmed
                        ? '? You are affected'
                        : '? I’m affected too'}
                    </button>
                  </div>

                  <div className="impact-message">
                    <span>AI</span>
                    <strong>
                      {affectedCount} citizen
                      {affectedCount !== 1 ? 's' : ''} affected
                    </strong>
                    {hasConfirmed && <span> · Added by you</span>}
                  </div>

                  <div className="post-footer">
                    <span>
                      AI-analyzed civic report
                    </span>

                    <span className="status-text">
                      {complaint.status}
                    </span>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

export default CivicFeed






