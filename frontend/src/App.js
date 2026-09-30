import {useEffect, useState} from 'react'

import './App.css'
import CivicFeed from './components/CivicFeed'
import ComplaintForm from './components/ComplaintForm'
import AuthorityDashboard from './components/AuthorityDashboard'

const App = () => {
  const [activeView, setActiveView] = useState('feed')
  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    fetch('http://localhost:5000/api/complaints')
      .then(response => response.json())
      .then(data => setComplaints(data))
      .catch(error => console.log(error))
  }, [])

  const highPriorityCount = complaints.filter(
    complaint => complaint.severity === 'High',
  ).length

  const roadCount = complaints.filter(
    complaint => complaint.category === 'Road Damage',
  ).length

  const garbageCount = complaints.filter(
    complaint => complaint.category === 'Garbage',
  ).length

  const streetlightCount = complaints.filter(
    complaint => complaint.category === 'Streetlight',
  ).length

  const waterCount = complaints.filter(
    complaint => complaint.category === 'Water Leakage',
  ).length

  const resolvedCount = complaints.filter(
    complaint => complaint.status === 'Resolved',
  ).length

  const affectedCitizens = complaints.reduce(
    (total, complaint) => total + (complaint.duplicateCount || 1),
    0,
  )

  const renderView = () => {
    if (activeView === 'report') {
      return (
        <section className="page-card">
          <ComplaintForm />
        </section>
      )
    }

    if (activeView === 'authority') {
      return (
        <section className="page-card authority-card">
          <AuthorityDashboard />
        </section>
      )
    }

    if (activeView === 'pulse') {
      return (
        <section className="pulse-page">
          <p className="eyebrow">CIVIC INTELLIGENCE</p>
          <h1>?? City Pulse</h1>
          <p className="pulse-subtitle">
            See what your community is experiencing right now.
          </p>

          <div className="pulse-highlight">
            <div className="pulse-highlight-icon">??</div>
            <div>
              <span>High Priority Issues</span>
              <strong>{highPriorityCount}</strong>
              <small>Need attention</small>
            </div>
          </div>

          <div className="pulse-grid">
            <div className="pulse-card">
              <span>???</span>
              <strong>{roadCount}</strong>
              <small>Road Damage</small>
            </div>

            <div className="pulse-card">
              <span>???</span>
              <strong>{garbageCount}</strong>
              <small>Garbage</small>
            </div>

            <div className="pulse-card">
              <span>??</span>
              <strong>{streetlightCount}</strong>
              <small>Streetlights</small>
            </div>

            <div className="pulse-card">
              <span>??</span>
              <strong>{waterCount}</strong>
              <small>Water Issues</small>
            </div>
          </div>

          <div className="pulse-impact">
            <div>
              <span>??</span>
              <strong>{affectedCitizens}</strong>
              <small>Citizen reports</small>
            </div>

            <div>
              <span>??</span>
              <strong>{complaints.length}</strong>
              <small>Total issues</small>
            </div>

            <div>
              <span>?</span>
              <strong>{resolvedCount}</strong>
              <small>Resolved</small>
            </div>
          </div>

          <div className="pulse-message">
            <div className="pulse-icon">??</div>
            <div>
              <h3>CivicAI is listening</h3>
              <p>
                Every citizen report becomes part of the city's civic
                intelligence.
              </p>
            </div>
          </div>
        </section>
      )
    }

    return <CivicFeed />
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <button
          className="brand"
          type="button"
          onClick={() => setActiveView('feed')}
        >
          <span className="brand-icon">???</span>
          <span>
            <strong>CivicAI</strong>
            <small>Your City. Your Voice.</small>
          </span>
        </button>

        <div className="top-status">
          <span className="status-dot" />
          Community Live
        </div>
      </header>

      <main className="app-main">{renderView()}</main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={activeView === 'feed' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveView('feed')}
        >
          <span>??</span>
          <small>Feed</small>
        </button>

        <button
          type="button"
          className={
            activeView === 'pulse' ? 'nav-item active' : 'nav-item'
          }
          onClick={() => setActiveView('pulse')}
        >
          <span>??</span>
          <small>Pulse</small>
        </button>

        <button
          type="button"
          className="report-nav"
          onClick={() => setActiveView('report')}
        >
          <span>??</span>
          <small>Report</small>
        </button>

        <button
          type="button"
          className={
            activeView === 'authority'
              ? 'nav-item active'
              : 'nav-item'
          }
          onClick={() => setActiveView('authority')}
        >
          <span>???</span>
          <small>Authority</small>
        </button>

        <button
          type="button"
          className="nav-item"
          onClick={() => setActiveView('feed')}
        >
          <span>??</span>
          <small>Profile</small>
        </button>
      </nav>
    </div>
  )
}

export default App
