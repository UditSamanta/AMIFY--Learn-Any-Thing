import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/client'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [subject, setSubject] = useState('')
  const [aim, setAim] = useState('')
  const [questions, setQuestions] = useState([])
  const [knowledgeProfile, setKnowledgeProfile] = useState(null)
  const [pathway, setPathway] = useState(null)
  const [currentConcept, setCurrentConcept] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [progress, setProgress] = useState(null)
  const [mcqSet, setMcqSet] = useState(null)
  const [agentEvents, setAgentEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [resources, setResources] = useState(null)

  const addAgentEvent = useCallback((event) => {
    setAgentEvents(prev => {
      if (event.id && prev.some(e => e.id === event.id)) return prev;
      return [...prev.slice(-9), { ...event, id: event.id || Date.now(), timestamp: new Date() }];
    });
  }, []);

  const startSession = useCallback(async (name, subjectName, aimText = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.createSession(name, subjectName, aimText)
      setSessionId(res.data.session_id)
      setSubject(subjectName || aimText)
      setAim(aimText || subjectName)
      setQuestions(res.data.questions.questions || [])
      return res.data
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to start session')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const submitDiagnostic = useCallback(async (answers) => {
    setLoading(true)
    try {
      const res = await api.submitDiagnostic(sessionId, answers)
      setKnowledgeProfile(res.data.knowledge_profile)
      setPathway(res.data.pathway)
      return res.data
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit diagnostic')
      throw e
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const loadCurrentConcept = useCallback(async () => {
    setLoading(true)
    setExplanation(null) // Clear stale state so Tutor shows loading screen
    try {
      const res = await api.getCurrentConcept(sessionId)
      // If backend signals all concepts are complete, return the signal
      if (res.data.completed) {
        return res.data  // { completed: true, next_state: "COMPLETE" }
      }
      setCurrentConcept(res.data.concept_node)
      setExplanation(res.data.explanation)
      setMcqSet(res.data.mcq_set || null)
      return res.data
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load concept')
      throw e
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const submitAssessment = useCallback(async (answers) => {
    setLoading(true)
    try {
      const res = await api.submitAssessment(sessionId, answers)
      return res.data
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit assessment')
      throw e
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const refreshProgress = useCallback(async () => {
    if (!sessionId) return
    const res = await api.getProgress(sessionId)
    setProgress(res.data)
    return res.data
  }, [sessionId])

  const loadRoadmap = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const res = await api.getRoadmap(sessionId)
      setRoadmap(res.data.roadmap)
      setResources(res.data.resources)
      return res.data
    } catch (e) {
      setError(e.response?.data?.error || 'Roadmap not yet available')
      throw e
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  return (
    <SessionContext.Provider value={{
      sessionId, subject, aim, questions, knowledgeProfile, pathway,
      currentConcept, explanation, mcqSet, progress, agentEvents,
      loading, error, roadmap, resources,
      addAgentEvent, startSession, submitDiagnostic,
      loadCurrentConcept, submitAssessment, refreshProgress, loadRoadmap
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
