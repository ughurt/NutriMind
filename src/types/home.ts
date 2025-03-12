export type WeightEntry = {
  id: string;
  user_id: string;
  weight: number;
  weight_goal?: number;
  date: string;
  created_at: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  userId: string;
  dateEarned: Date;
};

export type Reminder = {
  id: string;
  title: string;
  time: string;
  icon: string;
  userId: string;
  isActive: boolean;
}; 