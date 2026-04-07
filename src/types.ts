export type Frequency = '1x' | '2x' | '3x';
export type MealTiming = 'Before Meal' | 'After Meal' | 'No Preference';
export type DoseStatus = 'Taken' | 'Missed' | 'Upcoming';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  mealTiming: MealTiming;
  color: string;
  times: string[]; // "HH:MM" 24-hour strings, one per dose per day
}

export interface Dose {
  id: string;
  medicationId: string;
  medicationName: string;
  time: string;
  status: DoseStatus;
  type?: string; // e.g., "Capsule", "Softgel"
}

export interface HistoryItem {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  status: 'Taken' | 'Missed';
  date: string;
}
