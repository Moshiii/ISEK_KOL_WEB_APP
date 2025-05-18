import React from 'react';
import { Task, SubTask } from '../types';
import { getAgentById } from '../data/agents';
import AgentBadge from './AgentBadge';
import { CheckCircle2, CircleDashed, CircleDot, ChevronDown, ChevronRight } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);

  if (tasks.length === 0) {
    return <div className="text-gray-400 text-sm italic">No tasks yet</div>;
  }

  const getStatusIcon = (status: Task['status'] | SubTask['status']) => {
    switch (status) {
      case 'pending':
        return <CircleDashed className="text-gray-400" size={18} />;
      case 'in-progress':
        return <CircleDot className="text-[#5370FF]" size={18} />;
      case 'completed':
        return <CheckCircle2 className="text-[#FF66C5]" size={18} />;
    }
  };

  const getStatusText = (status: Task['status'] | SubTask['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSubTasks = (subTasks: SubTask[], parentTaskId: string) => {
    if (!expandedTasks.includes(parentTaskId)) return null;

    return (
      <div className="ml-4 mt-2 space-y-2">
        {subTasks.map(subtask => {
          const agent = getAgentById(subtask.assignedTo);
          
          return (
            <div 
              key={subtask.id} 
              className="gradient-secondary p-2 rounded-lg border border-gray-700 transition-all hover:border-gray-600"
            >
              <div className="flex items-start justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-300">{subtask.title}</h5>
                <div className="flex items-center space-x-1 text-xs">
                  {getStatusIcon(subtask.status)}
                  <span className={
                    subtask.status === 'pending' ? 'text-gray-400' : 
                    subtask.status === 'in-progress' ? 'text-[#5370FF]' : 
                    'text-[#FF66C5]'
                  }>
                    {getStatusText(subtask.status)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{subtask.description}</p>
              <div className="flex justify-between items-center">
                <AgentBadge agent={agent} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const agent = getAgentById(task.assignedTo);
        const hasSubTasks = task.subTasks && task.subTasks.length > 0;
        const isExpanded = expandedTasks.includes(task.id);
        
        return (
          <div key={task.id}>
            <div 
              className="gradient-secondary p-3 rounded-lg border border-gray-700 transition-all hover:border-gray-600 cursor-pointer"
              onClick={() => hasSubTasks && toggleTaskExpanded(task.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {hasSubTasks && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                  <h4 className="font-medium text-gray-200">{task.title}</h4>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  {getStatusIcon(task.status)}
                  <span className={
                    task.status === 'pending' ? 'text-gray-400' : 
                    task.status === 'in-progress' ? 'text-[#5370FF]' : 
                    'text-[#FF66C5]'
                  }>
                    {getStatusText(task.status)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-3">{task.description}</p>
              <div className="flex justify-between items-center">
                <AgentBadge agent={agent} size="sm" />
                <span className="text-xs text-gray-400">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
            {renderSubTasks(task.subTasks, task.id)}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;