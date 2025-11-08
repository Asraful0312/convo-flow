import React from 'react';
import { Button } from '@/components/ui/button';

interface MapConfirmationProps {
  address: string;
  onConfirm: (isCorrect: boolean) => void;
}

export default function MapConfirmation({ address, onConfirm }: MapConfirmationProps) {
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="space-y-4 rounded-xl bg-white p-4 border">
      <iframe
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: '12px' }}
        loading="lazy"
        allowFullScreen
        src={embedUrl}
      ></iframe>
      <p className="text-center text-sm text-muted-foreground">Is this the correct location?</p>
      <div className="flex justify-center gap-3">
        <Button onClick={() => onConfirm(true)}>Yes, this is correct</Button>
        <Button variant="outline" onClick={() => onConfirm(false)}>No, search again</Button>
      </div>
    </div>
  );
}
