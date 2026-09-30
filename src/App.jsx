// 第 9 步：新增、刪除、完成、篩選任務 + localStorage 保存資料

import { useState, useRef, useEffect } from 'react'

// localStorage 的儲存名稱
const STORAGE_KEY = 'todo-app-tasks'

// 從 localStorage 讀取任務；讀不到或資料壞掉時回傳空陣列
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 篩選選項：放在元件外面，因為它不會改變
const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

// 篩選後沒有任務時，依照目前篩選顯示不同提示
const EMPTY_MESSAGES = {
  active: '沒有未完成的任務，全部都做完了！',
  completed: '還沒有已完成的任務，勾選任務即可標記為完成。',
}

function App() {
  // 傳入函式（而不是 loadTasks()），只會在第一次渲染時讀取 localStorage
  const [tasks, setTasks] = useState(loadTasks)
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')
  // 目前的篩選條件：'all' | 'active' | 'completed'
  const [filter, setFilter] = useState('all')
  const inputRef = useRef(null)

  // tasks 每次改變後，自動存進 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // 儲存空間已滿或瀏覽器禁止存取時，不讓整個 App 當掉
    }
  }, [tasks])

  function handleAddTask(e) {
    e.preventDefault()
    const title = inputValue.trim()

    if (title === '') {
      setError('請輸入任務名稱')
      inputRef.current.focus()
      return
    }

    const newTask = {
      id: crypto.randomUUID(),
      title: title,
      completed: false,
    }

    setTasks([...tasks, newTask])
    setInputValue('')
    setError('')
    inputRef.current.focus()
  }

  function handleDeleteTask(id) {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  // 切換完成狀態：找到該任務，把 completed 反過來，其餘保持不變
  function handleToggleTask(id) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  function handleInputChange(e) {
    setInputValue(e.target.value)
    if (error) setError('')
  }

  // 依照目前篩選條件，算出要顯示的任務
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true // 'all'：全部顯示
  })

  const totalCount = tasks.length
  const completedCount = tasks.filter((task) => task.completed).length
  const activeCount = totalCount - completedCount

  return (
    <div className="app">
      <header className="app-header">
        <h1>任務管理</h1>
      </header>

      <main className="app-main">
        <section className="task-form-section" aria-labelledby="form-heading">
          <h2 id="form-heading" className="visually-hidden">新增任務</h2>
          <form className="task-form" onSubmit={handleAddTask} noValidate>
            <label htmlFor="task-input" className="visually-hidden">
              任務內容
            </label>
            <input
              id="task-input"
              ref={inputRef}
              type="text"
              className={`task-input ${error ? 'has-error' : ''}`}
              placeholder="輸入新任務，例如：買牛奶"
              autoComplete="off"
              value={inputValue}
              onChange={handleInputChange}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'task-input-error' : undefined}
            />
            <button type="submit" className="btn btn-add">
              新增
            </button>
          </form>
          {error && (
            <p id="task-input-error" className="form-error" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="filter-section" aria-labelledby="filter-heading">
          <h2 id="filter-heading" className="visually-hidden">篩選任務</h2>
          <div className="filter-group" role="group" aria-labelledby="filter-heading">
            {/* 用陣列產生三個按鈕，選中的那個加上 active 並設定 aria-pressed */}
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`btn btn-filter ${filter === item.value ? 'active' : ''}`}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="stats-section" aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="visually-hidden">任務統計</h2>
          <p className="stat" aria-live="polite">
            總共 <strong>{totalCount}</strong> 項
          </p>
          <p className="stat">未完成 <strong>{activeCount}</strong> 項</p>
          <p className="stat">已完成 <strong>{completedCount}</strong> 項</p>
        </section>

        <section className="task-list-section" aria-labelledby="list-heading">
          <h2 id="list-heading" className="visually-hidden">任務清單</h2>

          {tasks.length === 0 ? (
            // 完全沒有任務
            <p className="empty-state">目前沒有任務，在上方輸入後按「新增」建立第一個任務。</p>
          ) : visibleTasks.length === 0 ? (
            // 有任務，但目前篩選條件下沒有符合的
            <p className="empty-state">{EMPTY_MESSAGES[filter]}</p>
          ) : (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li
                  key={task.id}
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <label className="task-label">
                    {/* checked + onChange：勾選狀態由 state 控制 */}
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                    />
                    <span className="task-title">{task.title}</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-delete"
                    aria-label={`刪除任務：${task.title}`}
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
