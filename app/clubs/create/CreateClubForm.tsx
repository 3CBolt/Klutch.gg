'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { Loader2 } from 'lucide-react';
import { showToast } from '@/app/lib/toast';

export default function CreateClubForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
    };

    try {
      const response = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create club');
      }

      const club = await response.json();
      showToast.success('Club created successfully');
      router.push(`/clubs/${club.id}`);
    } catch (error) {
      showToast.error('Failed to create club');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Club Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Enter club name"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Enter club description"
            required
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Club'
          )}
        </Button>
      </form>
    </Card>
  );
} 