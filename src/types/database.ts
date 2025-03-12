export type Database = {
  public: {
    Tables: {
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          weight: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight: number;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight?: number;
          date?: string;
          created_at?: string;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          calories_consumed: number;
          calories_goal: number;
          water_consumed: number;
          water_goal: number;
          steps_count: number;
          steps_goal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string;
          calories_consumed?: number;
          calories_goal?: number;
          water_consumed?: number;
          water_goal?: number;
          steps_count?: number;
          steps_goal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          calories_consumed?: number;
          calories_goal?: number;
          water_consumed?: number;
          water_goal?: number;
          steps_count?: number;
          steps_goal?: number;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          calories?: number;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          date?: string;
        };
      };
    };
  };
};

export interface FoodDatabase {
  fdcId: string;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  nutrients: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
} 