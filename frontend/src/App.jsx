import { useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const API_URL = 'http://127.0.0.1:8000'

function SortableTask({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="bg-white p-6 mb-4 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing border-l-8 border-green-500 hover:shadow-2xl">
      <h4 className="font-bold text-xl">{task.title}</h4>
      {task.description && <p className="text-gray-600 mt-3">{task.description}</p>}
    </div>
  )
}

export default function App() {
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])
  const [loaded, setLoaded] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    if (loaded) return // ← эта строчка спасает от дублей навсегда

    fetch(`${API_URL}/columns/`)
      .then(r => r.json())
      .then(data => {
        if (data.length === 0) {
          ;['To Do', 'In Progress', 'Done'].forEach((title, i) =>
            fetch(`${API_URL}/columns/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, position: i })
            })
          )
          setTimeout(() => location.reload(), 700)
        } else {
          setColumns(data)
        }
      })

    fetch(`${API_URL}/tasks/`)
      .then(r => r.json())
      .then(setTasks)

    setLoaded(true)
  }, [loaded])

  const handleDragEnd = (e) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)
    if (activeTask.column_id !== overTask.column_id) {
      fetch(`${API_URL}/tasks/${activeTask.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_column_id: overTask.column_id, new_position: overTask.position })
      }).then(() => location.reload())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-600 to-purple-700 p-10">
      <h1 className="text-6xl font-black text-white text-center mb-16 drop-shadow-2xl">Моя Kanban-доска</h1>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          {columns.map(col => (
            <div key={col.id} className="bg-white/90 rounded-3xl p-10 shadow-2xl min-h-96">
              <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">{col.title}</h2>
              <SortableContext items={tasks.filter(t => t.column_id === col.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasks
                  .filter(t => t.column_id === col.id)
                  .sort((a, b) => a.position - b.position)
                  .map(task => <SortableTask key={task.id} task={task} />)}
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
