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
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-6 mb-4 rounded-2xl shadow-xl cursor-grab active:cursor-grabbing hover:shadow-2xl border-l-8 border-indigo-600 transition-all"
    >
      <h4 className="font-bold text-xl text-gray-800">{task.title}</h4>
      {task.description && <p className="text-gray-600 mt-3">{task.description}</p>}
    </div>
  )
}

export default function App() {
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])

  const sensors = useSensors(useSensor(PointerSensor))

  // Один раз загружаем данные и создаём колонки, если их нет
  useEffect(() => {
    const loadData = async () => {
      // Загружаем колонки
      let cols = await fetch(`${API_URL}/columns/`).then(r => r.json())
      if (cols.length === 0) {
        const defaultCols = ['To Do', 'In Progress', 'Done']
        for (let i = 0; i < defaultCols.length; i++) {
          await fetch(`${API_URL}/columns/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: defaultCols[i], position: i })
          })
        }
        // Перезагружаем, чтобы увидеть новые колонки
        location.reload()
        return
      }
      setColumns(cols)

      // Загружаем задачи
      const tasksData = await fetch(`${API_URL}/tasks/`).then(r => r.json())
      setTasks(tasksData)
    }

    loadData()
  }, []) // ← пустой массив — выполняется только один раз

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)

    if (activeTask.column_id !== overTask.column_id) {
      fetch(`${API_URL}/tasks/${activeTask.id}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_column_id: overTask.column_id,
          new_position: overTask.position
        })
      }).then(() => location.reload())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-10">
      <h1 className="text-6xl font-black text-center text-white mb-16 drop-shadow-2xl">
        Моя Kanban-доска
      </h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
          {columns.map(column => (
            <div key={column.id} className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl min-h-96">
              <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center pb-4 border-b-4 border-purple-400">
                {column.title}
              </h2>
              <SortableContext items={tasks.filter(t => t.column_id === column.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasks
                  .filter(t => t.column_id === column.id)
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
