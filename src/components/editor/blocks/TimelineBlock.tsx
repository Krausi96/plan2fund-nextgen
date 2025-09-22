/**
 * TimelineBlock component for editor
 * Displays timeline of events or milestones
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
}

interface TimelineBlockProps {
  events: TimelineEvent[];
  title?: string;
  onEdit?: (events: TimelineEvent[]) => void;
}

export default function TimelineBlock({ 
  events, 
  title = "Timeline",
  onEdit 
}: TimelineBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editEvents, setEditEvents] = useState<TimelineEvent[]>(events);

  const handleAddEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      date: '',
      title: '',
      description: '',
      status: 'planned'
    };
    setEditEvents([...editEvents, newEvent]);
  };

  const handleUpdateEvent = (id: string, field: keyof TimelineEvent, value: string) => {
    setEditEvents(prev => 
      prev.map(event => 
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const handleDeleteEvent = (id: string) => {
    setEditEvents(prev => prev.filter(event => event.id !== id));
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit(editEvents);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditEvents([...events]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'planned':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const sortedEvents = [...(isEditing ? editEvents : events)].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onEdit && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mb-4">
          <Button size="sm" onClick={handleAddEvent} className="mb-4">
            Add Event
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <div key={event.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${getStatusColor(event.status)}`}>
                {getStatusIcon(event.status)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={event.date}
                      onChange={(e) => handleUpdateEvent(event.id, 'date', e.target.value)}
                      placeholder="Date (YYYY-MM-DD)"
                      type="date"
                    />
                    <select
                      value={event.status}
                      onChange={(e) => handleUpdateEvent(event.id, 'status', e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                    >
                      <option value="planned">Planned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <Input
                    value={event.title}
                    onChange={(e) => handleUpdateEvent(event.id, 'title', e.target.value)}
                    placeholder="Event title"
                  />
                  <Textarea
                    value={event.description}
                    onChange={(e) => handleUpdateEvent(event.id, 'description', e.target.value)}
                    placeholder="Event description"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-500">{event.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedEvents.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No timeline events yet</p>
          {isEditing && (
            <Button size="sm" onClick={handleAddEvent} className="mt-2">
              Add First Event
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
