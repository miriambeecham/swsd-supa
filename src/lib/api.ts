// Client-side API functions that call our server endpoints

// Get classes
export async function getClasses(filterFormula?: string) {
  const url = filterFormula 
    ? `/api/classes?filter=${encodeURIComponent(filterFormula)}`
    : '/api/classes';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get schedules
export async function getSchedules(filterFormula?: string) {
  const url = filterFormula 
    ? `/api/schedules?filter=${encodeURIComponent(filterFormula)}`
    : '/api/schedules';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Legacy functions for backward compatibility
export async function getClassesWithSchedules() {
  return getClasses();
}

export async function getUpcomingSchedules(classType?: string) {
  return getSchedules();
}

export async function getMotherDaughterClasses() {
  return getUpcomingSchedules('mothers-daughters');
}

export async function getAdultTeenClasses() {
  return getUpcomingSchedules('adult-teen');
}