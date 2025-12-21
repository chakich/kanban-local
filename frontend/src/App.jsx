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

function SortableTask({ task, columns, onMoveLeft, onMoveRight, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const currentIndex = columns.findIndex(col => col.id === task.column_id)
  const canMoveLeft = currentIndex > 0
  const canMoveRight = currentIndex < columns.length - 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-6 mb-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg border border-gray-200 relative group"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-12">
          <h4 className="font-bold text-lg text-gray-800">{task.title}</h4>
          {task.description && <p className="text-gray-600 text-sm mt-2">{task.description}</p>}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canMoveLeft) onMoveLeft(task.id, columns[currentIndex - 1].id)
            }}
            disabled={!canMoveLeft}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl ${canMoveLeft ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (canMoveRight) onMoveRight(task.id, columns[currentIndex + 1].id)
            }}
            disabled={!canMoveRight}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl ${canMoveRight ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
            }}
            className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl hover:bg-red-600"
          >
            −
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState({})

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    const loadData = async () => {
      const cols = await fetch(`${API_URL}/columns/`).then(r => r.json())
      if (cols.length === 0) {
        const defaultCols = ['To Do', 'In Progress', 'Done']
        for (let i = 0; i < defaultCols.length; i++) {
          await fetch(`${API_URL}/columns/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: defaultCols[i], position: i })
          })
        }
        location.reload()
        return
      }
      setColumns(cols)

      const tasksData = await fetch(`${API_URL}/tasks/`).then(r => r.json())
      setTasks(tasksData)
    }

    loadData()
  }, [])

  const addTask = (columnId) => {
    const title = newTaskTitle[columnId]?.trim()
    if (!title) return

    fetch(`${API_URL}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: '', column_id: columnId })
    }).then(() => {
      setNewTaskTitle(prev => ({ ...prev, [columnId]: '' }))
      location.reload()
    })
  }

  const moveTaskToColumn = (taskId, newColumnId) => {
    // ИСПРАВЛЕНО: отправляем правильные имена полей (column_id, position)
    fetch(`${API_URL}/tasks/${taskId}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        column_id: newColumnId,
        position: 0
      })
    }).then(() => location.reload())
  }

  const deleteTask = (taskId) => {
    if (!confirm('Удалить задачу?')) return

    fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE'
    }).then(() => location.reload())
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeTask = tasks.find(t => t.id === active.id)
    const overTask = tasks.find(t => t.id === over.id)

    if (activeTask && overTask && activeTask.column_id !== overTask.column_id) {
      moveTaskToColumn(activeTask.id, overTask.column_id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-5xl font-bold text-center text-gray-800 mb-12">
        Моя Kanban-доска
      </h1>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {columns.map(column => (
            <div key={column.id} className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {column.title} ({tasks.filter(t => t.column_id === column.id).length})
              </h2>

              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Новая задача"
                  value={newTaskTitle[column.id] || ''}
                  onChange={(e) => setNewTaskTitle(prev => ({ ...prev, [column.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addTask(column.id)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => addTask(column.id)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-bold text-xl"
                >
                  +
                </button>
              </div>

              <SortableContext items={tasks.filter(t => t.column_id === column.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                {tasks
                  .filter(t => t.column_id === column.id)
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      columns={columns}
                      onMoveLeft={moveTaskToColumn}
                      onMoveRight={moveTaskToColumn}
                      onDelete={deleteTask}
                    />
                  ))}
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}
