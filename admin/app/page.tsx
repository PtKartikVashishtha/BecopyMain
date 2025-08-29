'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md p-8">
            <div className="flex flex-col items-center space-y-6">
              <Shield className="h-12 w-12 text-primary" />
              <h1 className="text-3xl font-bold text-center">Admin Portal</h1>
              <p className="text-muted-foreground text-center">
                Manage content, approve submissions, and monitor activity
              </p>
              <div className="w-full space-y-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full" size="lg">
                    Login to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}