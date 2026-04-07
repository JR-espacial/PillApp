import { Medication, Dose, HistoryItem } from './types';

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Omeprazole',
    dosage: '20mg Capsule',
    frequency: '2x',
    mealTiming: 'Before Meal',
    color: 'bg-primary-container',
    times: ['08:00', '20:00'],
  },
  {
    id: '2',
    name: 'Vitamin D3',
    dosage: '1000 IU Softgel',
    frequency: '1x',
    mealTiming: 'After Meal',
    color: 'bg-secondary-container',
    times: ['08:00'],
  },
  {
    id: '3',
    name: 'Metformin',
    dosage: '500mg Tablet',
    frequency: '2x',
    mealTiming: 'No Preference',
    color: 'bg-tertiary-container',
    times: ['08:00', '20:00'],
  },
];

export const TODAY_DOSES: Dose[] = [
  {
    id: 'd1',
    medicationId: 'iron',
    medicationName: 'Iron',
    time: '7:00 AM',
    status: 'Missed',
  },
  {
    id: 'd2',
    medicationId: 'zinc',
    medicationName: 'Zinc',
    time: '7:30 AM',
    status: 'Taken',
  },
  {
    id: 'd3',
    medicationId: '1',
    medicationName: 'Vitamin C',
    time: '8:00 AM',
    status: 'Upcoming',
    type: '1 Capsule • Take with water'
  },
  {
    id: 'd4',
    medicationId: 'omega3',
    medicationName: 'Omega 3',
    time: '1:00 PM',
    status: 'Upcoming',
  },
];

export const HISTORY: HistoryItem[] = [
  { id: 'h1', medicationName: 'Lisinopril 10mg', dosage: '10mg', time: '08:00 AM', status: 'Taken', date: 'Today' },
  { id: 'h2', medicationName: 'Omega-3 Fish Oil', dosage: '1000mg', time: '12:30 PM', status: 'Taken', date: 'Today' },
  { id: 'h3', medicationName: 'Melatonin 5mg', dosage: '5mg', time: '09:00 PM', status: 'Missed', date: 'Yesterday' },
  { id: 'h4', medicationName: 'Omega-3 Fish Oil', dosage: '1000mg', time: '12:30 PM', status: 'Taken', date: 'Yesterday' },
  { id: 'h5', medicationName: 'Lisinopril 10mg', dosage: '10mg', time: '08:00 AM', status: 'Taken', date: 'Yesterday' },
  { id: 'h6', medicationName: 'Lisinopril 10mg', dosage: '10mg', time: '08:00 AM', status: 'Taken', date: 'Monday, Oct 23' },
];
