import axios from 'axios'

const BASE = 'http://localhost:8000/api'

export const api = {
  createSession: (userName, subject, aim = '') =>
    axios.post(`${BASE}/session/create`, { user_name: userName, subject, aim }),

  submitDiagnostic: (sessionId, answers) =>
    axios.post(`${BASE}/session/${sessionId}/diagnostic`, { answers }),

  getCurrentConcept: (sessionId) =>
    axios.get(`${BASE}/session/${sessionId}/concept`),

  submitAssessment: (sessionId, answers) =>
    axios.post(`${BASE}/session/${sessionId}/assess`, { answers }),

  getProgress: (sessionId) =>
    axios.get(`${BASE}/session/${sessionId}/progress`),

  getRoadmap: (sessionId) =>
    axios.get(`${BASE}/session/${sessionId}/roadmap`),

  streamEvents: (sessionId, onEvent) => {
    const sse = new EventSource(`${BASE}/session/${sessionId}/stream`)
    sse.onmessage = (e) => {
      try { onEvent(JSON.parse(e.data)) } catch {}
    }
    sse.onerror = () => {}
    return () => sse.close()
  }
}

