import React, { createContext, useContext, useState } from 'react'
import { SEED_PROJECTS } from '../pages/Roadmap/roadmapData.js'

const RoadmapContext = createContext(null)

export function RoadmapProvider({ children }) {
  const [projects, setProjects] = useState(SEED_PROJECTS)
  return (
    <RoadmapContext.Provider value={{ projects, setProjects }}>
      {children}
    </RoadmapContext.Provider>
  )
}

export function useRoadmap() {
  return useContext(RoadmapContext)
}
