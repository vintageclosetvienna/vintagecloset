'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, PencilSimple, Trash, MapPin, Clock, CalendarBlank, X, Spinner, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { FormInput, FormTextarea, FormSelect, ImageUpload } from '@/components/admin';
import { 
  Event, 
  getAllEvents, 
  statusColors,
  generateSlug,
} from '@/lib/events-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Coming Soon', label: 'Coming Soon' },
  { value: 'Past', label: 'Past' },
];

// Edit Event Modal Component
function EditEventModal({
  event,
  onClose,
  onSave,
  isSaving,
}: {
  event: Event;
  onClose: () => void;
  onSave: (eventId: string, data: Partial<Event>) => Promise<void>;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    location: event.location,
    image: event.image,
    status: event.status,
    spotsLeft: event.spotsLeft,
    isPublished: event.isPublished ?? true,
  });

  const updateField = (field: string, value: string | string[] | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    await onSave(event.id, {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      location: formData.location,
      image: Array.isArray(formData.image) ? formData.image[0] : formData.image,
      status: formData.status as Event['status'],
      spotsLeft: formData.spotsLeft,
      isPublished: formData.isPublished,
    });
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const isValid = formData.title && formData.date && formData.location;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
            <div>
              <h2 className="font-display font-bold text-xl text-ink">Edit Event</h2>
              <p className="text-sm text-muted mt-1">{event.slug}</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div
            className="p-6 space-y-6 flex-1 min-h-0"
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Event Image */}
            <ImageUpload
              label="Event Image"
              value={formData.image ? [formData.image] : []}
              onChange={(urls) => updateField('image', urls[0] || '')}
            />

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Event Details</h3>

              <FormInput
                label="Event Name"
                placeholder="Enter event name"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />

              <FormTextarea
                label="Description"
                placeholder="Describe the event..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Date & Time</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  required
                />

                <FormInput
                  label="Time"
                  placeholder="e.g. 10:00 - 18:00"
                  value={formData.time}
                  onChange={(e) => updateField('time', e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Location</h3>

              <FormInput
                label="Address"
                placeholder="Full address"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
                required
              />
            </div>

            {/* Status & Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Status & Settings</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Event Status"
                  options={STATUS_OPTIONS}
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                />

                <FormInput
                  label="Spots Left"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.spotsLeft?.toString() || ''}
                  onChange={(e) => updateField('spotsLeft', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>

              {/* Published Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {formData.isPublished ? (
                      <Eye size={20} className="text-green-600" />
                    ) : (
                      <EyeSlash size={20} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{formData.isPublished ? 'Published' : 'Unpublished'}</p>
                    <p className="text-xs text-muted">{formData.isPublished ? 'Visible to everyone' : 'Hidden from public'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateField('isPublished', !formData.isPublished)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    formData.isPublished ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.isPublished ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Spinner size={16} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const data = await getAllEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const handleSaveEvent = async (eventId: string, data: Partial<Event>) => {
    setIsSaving(true);
    try {
      if (isSupabaseConfigured()) {
        // Convert frontend format to database format
        const dbData = {
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          location: data.location,
          image: data.image,
          status: data.status,
          spots_left: data.spotsLeft,
          is_published: data.isPublished,
        };

        const { error } = await supabase
          .from('events')
          .update(dbData as never)
          .eq('id', eventId);

        if (error) throw error;

        // Refetch events
        const updatedEvents = await getAllEvents();
        setEvents(updatedEvents);
      } else {
        // Mock update for local development
        setEvents(prev => prev.map(e => 
          e.id === eventId ? { ...e, ...data } : e
        ));
      }
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setDeletingId(eventId);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);

        if (error) throw error;
      }

      // Remove from local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingCount = events.filter(e => e.status === 'Upcoming').length;
  const comingSoonCount = events.filter(e => e.status === 'Coming Soon').length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Events</h1>
          <p className="text-muted mt-1">
            {upcomingCount} upcoming{comingSoonCount > 0 && `, ${comingSoonCount} coming soon`}
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus size={16} weight="bold" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-hairline overflow-hidden animate-pulse">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-48 h-48 bg-surface" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-4 bg-surface rounded w-1/3" />
                  <div className="h-5 bg-surface rounded w-3/4" />
                  <div className="h-4 bg-surface rounded w-full" />
                  <div className="h-4 bg-surface rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarBlank size={32} className="text-muted" />
          </div>
          <h2 className="text-xl font-display font-bold text-ink mb-2">No events yet</h2>
          <p className="text-muted mb-6">Create your first event to engage with your community.</p>
          <Link href="/admin/events/new">
            <Button className="gap-2">
              <Plus size={16} weight="bold" />
              Create Event
            </Button>
          </Link>
        </div>
      ) : (
        /* Events Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <article 
              key={event.id}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group ${
                event.isPublished === false ? 'border-amber-200' : 'border-hairline'
              }`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                  {event.image ? (
                    <Image
                      src={event.image}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface flex items-center justify-center">
                      <CalendarBlank size={48} className="text-muted" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md ${statusColors[event.status]}`}>
                      {event.status}
                    </span>
                    {event.isPublished === false && (
                      <span className="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-700">
                        Hidden
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 flex flex-col">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-accent-start font-medium mb-2">
                    <CalendarBlank size={16} weight="bold" />
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </div>

                  {/* Title */}
                  <h2 className="font-display font-bold text-lg text-ink mb-2">
                    {event.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
                    {event.description}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-col gap-1.5 text-xs text-muted mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} weight="bold" className="text-muted flex-shrink-0" />
                      {event.location}
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} weight="bold" className="text-muted flex-shrink-0" />
                        {event.time}
                      </div>
                    )}
                    {event.spotsLeft !== null && (
                      <div className="flex items-center gap-2 text-accent-start">
                        <span className="font-medium">{event.spotsLeft} spots left</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-hairline">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => setEditingEvent(event)}
                    >
                      <PencilSimple size={14} weight="bold" />
                      Edit
                    </Button>
                    <button 
                      className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      onClick={() => handleDeleteEvent(event.id)}
                      disabled={deletingId === event.id}
                    >
                      {deletingId === event.id ? (
                        <Spinner size={16} className="animate-spin" />
                      ) : (
                        <Trash size={16} weight="bold" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEvent}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
