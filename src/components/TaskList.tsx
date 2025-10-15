
import { useEffect, useState } from 'react';
import { getTasks, deleteTask, toggleTask } from '../lib/idb';

export default function TaskList() {
  const [tasks, setTasks] = useState<any[]>([]);

  async function loadTasks() {
    const data = await getTasks();
    setTasks(data.reverse());
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div>
      <h3>📋 Tareas guardadas</h3>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id).then(loadTasks)}
              />
              {task.title}
            </label>
            <button onClick={() => deleteTask(task.id).then(loadTasks)}>
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
