import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WeightEntry {
  id: string;
  user_id: string;
  weight: number;
  note?: string;
  date: string;
  created_at: string;
}

export const useWeight = () => {
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWeights = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setWeights(data || []);
    } catch (error) {
      console.error('Error fetching weights:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWeight = async (weight: number, note?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('weight_entries')
        .insert([{
          user_id: user.id,
          weight,
          note,
          date: new Date().toISOString().split('T')[0],
        }]);

      if (error) throw error;
      await fetchWeights();
    } catch (error) {
      console.error('Error adding weight:', error);
      throw error;
    }
  };

  const editWeight = async (id: string, weight: number, note?: string) => {
    if (!user) return;

    try {
      console.log('Editing weight entry:', { id, weight, note }); // Debug log
      const { error } = await supabase
        .from('weight_entries')
        .update({
          weight,
          note,
          // Don't update the date when editing
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error editing weight:', error);
        throw error;
      }

      // Verify update
      const { data: checkData } = await supabase
        .from('weight_entries')
        .select()
        .eq('id', id)
        .single();

      console.log('Updated weight entry:', checkData);

      await fetchWeights();
    } catch (error) {
      console.error('Error editing weight:', error);
      throw error;
    }
  };

  const deleteWeight = async (id: string) => {
    if (!user) return;

    try {
      console.log('Deleting weight entry:', id); // Debug log
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error deleting weight:', error);
        throw error;
      }
      
      // Verify deletion
      const { data: checkData } = await supabase
        .from('weight_entries')
        .select()
        .eq('id', id)
        .single();
        
      if (checkData) {
        console.error('Weight entry still exists after deletion');
      } else {
        console.log('Weight entry successfully deleted');
      }

      await fetchWeights();
    } catch (error) {
      console.error('Error deleting weight:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchWeights();
  }, [user]);

  return {
    weights,
    loading,
    addWeight,
    editWeight,
    deleteWeight,
    refreshWeights: fetchWeights,
    currentWeight: weights[0]?.weight,
  };
}; 