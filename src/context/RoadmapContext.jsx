import React, { createContext, useContext, useState, useEffect } from 'react'
import { SEED_PROJECTS } from '../pages/Roadmap/roadmapData.js'
import { api } from '../utils/api.js'

const RoadmapContext = createContext(null)

export function RoadmapProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/api/roadmap/projects')
      .then(data => {
        if (data && data.length > 0) {
          setProjects(data)
        } else {
          // First run — seed DB with defaults
          setProjects(SEED_PROJECTS)
          SEED_PROJECTS.forEach(p =>
            api.put(`/api/roadmap/projects/${p.id}`, p).catch(console.error)
          )
        }
      })
      .catch(() => setProjects(SEED_PROJECTS))
      .finally(() => setLoaded(true))
  }, [])

  function updateProject(project) {
    setProjects(prev => prev.map(p => p.id === project.id ? project : p))
    api.put(`/api/roadmap/projects/${project.id}`, project).catch(console.error)
  }

  function addProject(project) {
    setProjects(prev => [...prev, project])
    api.put(`/api/roadmap/projects/${project.id}`, project).catch(console.error)
  }

  function removeProject(id) {
    setProjects(prev => prev.filter(p => p.id !== id))
    api.del(`/api/roadmap/projects/${id}`).catch(console.error)
  }

  return (
    <RoadmapContext.Provider value={{ projects, loaded, updateProject, addProject, removeProject }}>
      {children}
    </RoadmapContext.Provider>
  )
}

export function useRoadmap() {
  return useContext(RoadmapContext)
}
