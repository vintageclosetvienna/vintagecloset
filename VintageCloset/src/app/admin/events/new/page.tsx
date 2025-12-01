'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Spinner } from '@phosphor-icons/react';
import { 
  ImageUpload, 
  FormInput, 
  FormTextarea, 
  FormSelect 
} from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { generateSlug } from '@/lib/events-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'Coming Soon', label: 'Coming Soon' },
];

interface EventFormData {
  image: string[];
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: string;
  spotsLeft: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    image: [],
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    status: 'Upcoming',
    spotsLeft: '',
  });

  const updateField = <K extends keyof EventFormData>(
    field: K, 
    value: EventFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const slug = generateSlug(formData.title);
      const image = formData.image[0] || null;
      const spotsLeft = formData.spotsLeft ? parseInt(formData.spotsLeft) : null;

      if (isSupabaseConfigured()) {
        // Save to Supabase
        const eventData = {
          slug,
          title: formData.title,
          description: formData.description || null,
          date: formData.date,
          time: formData.time || null,
          location: formData.location,
          image,
          status: formData.status as 'Upcoming' | 'Coming Soon' | 'Past',
          spots_left: spotsLeft,
          is_published: true,
        };
        
        const { error: insertError } = await supabase
          .from('events')
          .insert(eventData as never);

        if (insertError) {
          // Check for duplicate slug
          if (insertError.code === '23505') {
            setError('An event with this title already exists. Please choose a different title.');
            setIsSubmitting(false);
            return;
          }
          throw insertError;
        }
      } else {
        // Mock save for local development
        console.log('Event data (mock):', { 
          slug,
          ...formData, 
          spotsLeft,
        });
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      router.push('/admin/events');
    } catch (err) {
      console.error('Error creating event:', err);
      setError('Failed to create event. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isValid = formData.title && formData.date && formData.location;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/events" 
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Events
        </Link>
        <h1 className="text-2xl font-display font-bold text-ink">Create New Event</h1>
        <p className="text-muted mt-1">Set up a new event for your community.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Image */}
        <ImageUpload
          label="Event Image"
          value={formData.image}
          onChange={(urls) => updateField('image', urls)}
          multiple={false}
        />

        {/* Event Details */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Event Details</h2>
          
          <FormInput
            label="Event Name"
            placeholder="e.g. Spring Drop Pop-Up"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

          <FormInput
            label="Location"
            placeholder="e.g. Neubaugasse 12, 1070 Wien"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            required
          />

          <FormTextarea
            label="Description"
            placeholder="Describe the event, what attendees can expect, etc."
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
          />
        </div>

        {/* Status & Settings */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Settings</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormSelect
              label="Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(e) => updateField('status', e.target.value)}
            />

            <FormInput
              label="Spots Available"
              type="number"
              placeholder="Leave empty for unlimited"
              value={formData.spotsLeft}
              onChange={(e) => updateField('spotsLeft', e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button 
            type="submit" 
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size={16} className="animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
          <Link href="/admin/events">
            <Button type="button" variant="ghost" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
