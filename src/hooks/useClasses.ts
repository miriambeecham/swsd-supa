import { useState, useEffect } from 'react';
import { getUpcomingSchedules } from '../lib/api';
import type { ClassSchedule } from '../lib/supabase';

export function useMotherDaughterClasses() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        const data = await getUpcomingSchedules('mothers-daughters');
        setClasses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingSchedules('mothers-daughters');
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  return { classes, loading, error, refetch };
}

export function useAdultTeenClasses() {
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClasses() {
      try {
        setLoading(true);
        const data = await getUpcomingSchedules('adult-teen');
        setClasses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch classes');
      } finally {
        setLoading(false);
      }
    }

    fetchClasses();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await getUpcomingSchedules('adult-teen');
      setClasses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  return { classes, loading, error, refetch };
}