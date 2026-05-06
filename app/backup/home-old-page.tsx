'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = {
  id: string
  first_name: string
  last_name: string
  email: string
}

type Building = {
  id: string
  concierge_id: string
  name: string
  address: string
}

type Task = {
  id: string
  title: string
  description: string | null
  apartment_or_area: string | null
  category: string
  priority: string
  status: string
  task_date: string
}

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [building, setBuilding] = useState<Building | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setLoading(false)
        return
      }

      const currentUser = session.user
      setUser(currentUser)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)

      const { data: buildingData } = await supabase
        .from('buildings_new')
        .select('*')
        .eq('concierge_id', currentUser.id)
        .single()

      setBuilding(buildingData)

      if (buildingData) {
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('building_id', buildingData.id)
          .order('created_at', { ascending: false })

        setTasks(tasksData || [])
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Arial' }}>
        <p>Cargando...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main style={{ padding: '24px', fontFamily: 'Arial' }}>
        <h1>Concierge App</h1>
        <p>No has iniciado sesión.</p>
        <a href="/login">Ir a iniciar sesión</a>
      </main>
    )
  }

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial' }}>
      <h1>Concierge App</h1>

      <div style={{ marginBottom: '24px' }}>
        <p>
          <strong>Usuario:</strong>{' '}
          {profile ? `${profile.first_name} ${profile.last_name}` : 'Sin perfil'}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Edificio:</strong> {building ? building.name : 'Sin edificio'}
        </p>

        <p>
          <strong>Dirección:</strong> {building ? building.address : 'Sin dirección'}
        </p>
      </div>

      <div style={{ marginBottom: '34px' }}>
        <a href="/setup-profile" style={{ marginRight: '16px' }}>
          Configurar perfil
        </a>

        <a href="/tasks/new">Crear nueva tarea</a>
      </div>

      <h2>Tareas</h2>

      {tasks.length === 0 ? (
        <p>No hay tareas</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              style={{
                border: '1px solid #ccc',
                padding: '12px',
                marginBottom: '10px',
                borderRadius: '8px',
              }}
            >
              <h3>{task.title}</h3>
              <p>{task.description}</p>

              <p>
                <strong>Área:</strong> {task.apartment_or_area}
              </p>

              <p>
                <strong>Categoría:</strong> {task.category}
              </p>

              <p>
                <strong>Prioridad:</strong> {task.priority}
              </p>

              <p>
                <strong>Estado:</strong> {task.status}
              </p>

              <p>
                <strong>Fecha:</strong> {task.task_date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
