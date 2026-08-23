/**
 * Google Calendar Coordinator Module for Google Apps Script
 */

function handleCalendarBooking(payload) {
  const calData = payload.calendarData || payload;
  const title = calData.title || "Executive Strategy Sync";
  
  const startTime = new Date(calData.startDateTime || calData.startTime || Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(calData.endDateTime || calData.endTime || startTime.getTime() + 45 * 60 * 1000);
  const description = calData.description || "Coordinated automatically by Executive AI Assistant";
  const location = calData.location || "Google Meet";

  const calendar = CalendarApp.getDefaultCalendar();

  // 1. Conflict Detection
  const existingEvents = calendar.getEvents(startTime, endTime);
  let hasConflict = existingEvents.length > 0;
  let conflictSummary = "";
  if (hasConflict) {
    conflictSummary = existingEvents.map(e => `"${e.getTitle()}" (${e.getStartTime().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`).join(", ");
  }

  // 2. Create Event in Google Calendar
  const event = calendar.createEvent(title, startTime, endTime, {
    description: description,
    location: location
  });

  // 3. Add Attendees if provided
  if (calData.attendees && Array.isArray(calData.attendees)) {
    calData.attendees.forEach(a => {
      const email = typeof a === "string" ? a : a.email;
      if (email && email.includes("@")) {
        event.addGuest(email);
      }
    });
  }

  const dateStr = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "EEE, MMM d 'at' h:mm a");
  const spoken = hasConflict
    ? `I've booked "${title}" for ${dateStr}, but please note there is a schedule overlap with ${conflictSummary}.`
    : `I have scheduled "${title}" on your Google Calendar for ${dateStr}.`;

  return {
    eventId: event.getId(),
    title: title,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    hasConflict: hasConflict,
    conflictDetails: conflictSummary,
    spokenResponse: spoken,
    calendarUrl: `https://calendar.google.com/calendar/r/eventedit/${event.getId()}`
  };
}
